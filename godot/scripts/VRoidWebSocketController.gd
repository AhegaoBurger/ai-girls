extends Node3D
class_name VRoidWebSocketController

# WebSocket controller for VRoid character with dual animation system:
# - Global library: Facial expressions and look directions (state-based)
# - Locomotion library: Mixamo body animations (timeline-based)

@export_group("Character Components")
@export var animation_player: AnimationPlayer
@export var vrm_node: Node3D  # The root node of your VRM model

@export_group("WebSocket Settings")
@export_enum("server", "client") var connection_mode: String = "server"
@export var websocket_port: int = 8080
@export var backend_url: String = "ws://localhost:3000/godot"
@export var auto_start: bool = true
@export var auto_reconnect: bool = true
@export var reconnect_delay: float = 2.0

# WebSocket server (server mode)
var tcp_server := TCPServer.new()
var websocket_peers: Array[WebSocketPeer] = []

# WebSocket client (client mode)
var ws_client: WebSocketPeer
var capabilities_sent: bool = false
var reconnect_timer: float = 0.0
var is_reconnecting: bool = false

# Current state
var current_clip: String = "idle"
var current_emotion: String = "neutral"
var current_look: String = ""

# Animation state tracking
var current_animation_type: String = "looping"  # "one_shot" or "looping"
var current_locomotion_anim: String = ""  # Track the actual Godot animation name for locomotion
var one_shot_animations = ["wave", "jump", "blow_kiss", "clap", "bow", "nod", "shake_head"]

# Map MCP animation names to your actual animation names
var animation_mappings = {
	# Body animations (locomotion library)
	"idle": "locomotion/X Bot",
	"sit": "locomotion/Sitting",
	"blow_kiss": "locomotion/Blow A Kiss",
	
	# Since you don't have all the Mixamo animations yet, 
	# we'll map missing ones to available alternatives
	"wave": "locomotion/Blow A Kiss",  # Use blow kiss as wave for now
	"jump": "locomotion/X Bot_001",
	"dance": "locomotion/Blow A Kiss_001",
	"clap": "locomotion/Blow A Kiss_002",
	"bow": "locomotion/Blow A Kiss_003",
	"think": "locomotion/Sitting_001",
	"point": "locomotion/Sitting_002",
	"nod": "locomotion/Sitting_003",
	
	# These don't exist yet but keeping for future
	"walk": "locomotion/X Bot",
	"run": "locomotion/X Bot",
	"stand": "locomotion/X Bot",
	"shake_head": "locomotion/X Bot_001",
	"laugh": "locomotion/Blow A Kiss"
}

# Map MCP emotions to your Global animations
var emotion_mappings = {
	"neutral": "neutral",
	"happy": "happy",
	"sad": "sad",
	"angry": "angry",
	"surprised": "surprised",
	"relaxed": "relaxed",

	# Map additional MCP emotions to closest available
	"confused": "surprised",
	"excited": "happy",
	"bored": "relaxed",
	"shy": "sad",
	"confident": "neutral"
}

# Look direction mappings
var look_mappings = {
	"down": "lookDown",
	"left": "lookLeft",
	"right": "lookRight",
	"up": "lookUp",
	"away": "lookLeft",  # Default "away" to looking left
	"user": ""  # Empty means look forward (no specific animation)
}

# Mouth shape animations for lip sync (future use)
var mouth_shapes = {
	"aa": "aa",
	"ee": "ee",
	"ih": "ih",
	"oh": "oh",
	"ou": "ou"
}

func _ready():
	print("VRoid WebSocket Controller starting...")

	# Auto-detect web mode
	if OS.has_feature("web"):
		print("Running in browser - switching to client mode")
		connection_mode = "client"
		# Use environment variable if available, otherwise use exported backend_url
		var env_url = OS.get_environment("BACKEND_URL")
		if not env_url.is_empty():
			backend_url = env_url + "/godot"

	if not animation_player:
		push_error("AnimationPlayer not assigned!")
		return

	# Connect to animation_finished signal
	animation_player.animation_finished.connect(_on_animation_finished)

	# List available animations for debugging
	print("Available animations:")
	for anim in animation_player.get_animation_list():
		print("  - ", anim)

	if auto_start:
		if connection_mode == "client":
			start_client()
		else:
			start_server()

	# Set default state - defer to next frame to ensure AnimationPlayer is ready
	call_deferred("_initialize_default_state")

func _initialize_default_state():
	_play_animation("idle")
	_set_emotion("neutral")

# Signal handler for when animations finish
func _on_animation_finished(anim_name: String):
	# Ignore non-locomotion animations (emotions, looks, etc. that use advance(0.0))
	if not anim_name.begins_with("locomotion/"):
		return

	# Only reset to idle if it was a one-shot locomotion animation
	if current_animation_type == "one_shot":
		print("One-shot animation finished: ", anim_name, " - returning to idle")
		_play_animation("idle")

# Get system capabilities by analyzing available animations
func _get_capabilities() -> Dictionary:
	if not animation_player:
		return {}

	var capabilities = {
		"clips": [],
		"emotions": [],
		"lookTargets": [],
		"mouthShapes": []
	}

	# Extract available clips from animation_mappings
	for clip_name in animation_mappings.keys():
		var anim_name = animation_mappings[clip_name]
		if animation_player.has_animation(anim_name):
			capabilities["clips"].append(clip_name)

	# Extract available emotions from emotion_mappings
	for emotion_name in emotion_mappings.keys():
		var anim_name = emotion_mappings[emotion_name]
		if animation_player.has_animation(anim_name):
			capabilities["emotions"].append(emotion_name)

	# Extract available look directions from look_mappings
	for look_name in look_mappings.keys():
		var anim_name = look_mappings[look_name]
		# Empty string means it's supported (looking forward)
		if anim_name.is_empty() or animation_player.has_animation(anim_name):
			capabilities["lookTargets"].append(look_name)

	# Extract available mouth shapes from mouth_shapes
	for shape_name in mouth_shapes.keys():
		var anim_name = mouth_shapes[shape_name]
		if animation_player.has_animation(anim_name):
			capabilities["mouthShapes"].append(shape_name)

	print("Capabilities discovered: ", capabilities)
	return capabilities

func start_server() -> bool:
	var err = tcp_server.listen(websocket_port)
	if err == OK:
		print("WebSocket server listening on port ", websocket_port)
		set_process(true)
		return true
	else:
		push_error("Failed to start server on port %d: %s" % [websocket_port, error_string(err)])
		return false

func stop_server():
	tcp_server.stop()
	for peer in websocket_peers:
		peer.close()
	websocket_peers.clear()
	set_process(false)
	print("Server stopped")

# Client mode functions
func start_client() -> bool:
	print("Starting WebSocket client...")
	print("Connecting to: ", backend_url)

	ws_client = WebSocketPeer.new()
	var err = ws_client.connect_to_url(backend_url)

	if err == OK:
		print("WebSocket client connection initiated")
		set_process(true)
		capabilities_sent = false
		return true
	else:
		push_error("Failed to connect to backend: " + error_string(err))
		return false

func stop_client():
	if ws_client:
		ws_client.close()
		ws_client = null
	capabilities_sent = false
	set_process(false)
	print("Client stopped")

func _send_capabilities_to_backend():
	if not ws_client or ws_client.get_ready_state() != WebSocketPeer.STATE_OPEN:
		return

	var capabilities = _get_capabilities()
	var message = {
		"type": "capabilities",
		"data": capabilities
	}

	ws_client.send_text(JSON.stringify(message))
	capabilities_sent = true
	print("Sent capabilities to backend: ", capabilities)

func _process(delta):
	if connection_mode == "client":
		_process_client_mode(delta)
	else:
		_process_server_mode(delta)

func _process_server_mode(_delta):
	# Accept new TCP connections
	while tcp_server.is_connection_available():
		var tcp_connection = tcp_server.take_connection()
		if tcp_connection:
			_handle_new_connection(tcp_connection)

	# Process existing WebSocket connections
	for i in range(websocket_peers.size() - 1, -1, -1):
		var peer = websocket_peers[i]
		peer.poll()

		var state = peer.get_ready_state()

		if state == WebSocketPeer.STATE_OPEN:
			while peer.get_available_packet_count() > 0:
				var packet = peer.get_packet()
				_handle_data(peer, packet)

		elif state == WebSocketPeer.STATE_CLOSED:
			print("WebSocket connection closed")
			websocket_peers.remove_at(i)

func _process_client_mode(delta):
	if not ws_client:
		# Handle reconnection
		if auto_reconnect and not is_reconnecting:
			reconnect_timer += delta
			if reconnect_timer >= reconnect_delay:
				reconnect_timer = 0.0
				is_reconnecting = true
				print("Attempting to reconnect...")
				start_client()
		return

	ws_client.poll()
	var state = ws_client.get_ready_state()

	if state == WebSocketPeer.STATE_OPEN:
		is_reconnecting = false

		# Send capabilities on first connection
		if not capabilities_sent:
			_send_capabilities_to_backend()

		# Receive commands from backend
		while ws_client.get_available_packet_count() > 0:
			var packet = ws_client.get_packet()
			_handle_client_data(packet)

	elif state == WebSocketPeer.STATE_CLOSED:
		print("WebSocket connection closed")
		ws_client = null
		capabilities_sent = false
		reconnect_timer = 0.0
		is_reconnecting = false

func _handle_client_data(data: PackedByteArray):
	var text = data.get_string_from_utf8()
	print("Received from backend: ", text)

	var json = JSON.new()
	var parse_result = json.parse(text)

	if parse_result == OK:
		var command = json.data
		_process_command_client(command)
	else:
		print("Failed to parse JSON: ", json.get_error_message())

func _process_command_client(command: Dictionary):
	# Process avatar control commands from backend
	# In client mode, we don't send responses back (fire-and-forget for MVP)

	# Handle different message types
	if command.has("type"):
		var msg_type = command.get("type")
		if msg_type == "welcome":
			print("Received welcome from backend")
			return
		elif msg_type == "avatar_control":
			# Extract command parameters
			pass  # Continue to process below

	# Process clip (body animation)
	if command.has("clip") and not command.get("clip", "").is_empty():
		var clip = command.get("clip")
		_play_animation(clip)

	# Process emotion (facial expression)
	if command.has("emotion") and not command.get("emotion", "").is_empty():
		var emotion = command.get("emotion")
		_set_emotion(emotion)

	# Process look direction
	if command.has("lookAt") and not command.get("lookAt", "").is_empty():
		var look_at = command.get("lookAt")
		_set_look_direction(look_at)

func _handle_new_connection(tcp_connection: StreamPeerTCP):
	var ws_peer = WebSocketPeer.new()
	var err = ws_peer.accept_stream(tcp_connection)

	if err == OK:
		websocket_peers.append(ws_peer)
		print("WebSocket client connected")

		# Send welcome with current state and capabilities
		ws_peer.poll()
		if ws_peer.get_ready_state() == WebSocketPeer.STATE_OPEN:
			var welcome = {
				"type": "welcome",
				"message": "Connected to Live-Vroid",
				"state": {
					"animation": current_clip,
					"emotion": current_emotion,
					"lookAt": current_look
				},
				"capabilities": _get_capabilities()
			}
			ws_peer.send_text(JSON.stringify(welcome))
	else:
		push_error("Failed to accept WebSocket connection")

func _handle_data(peer: WebSocketPeer, data: PackedByteArray):
	var text = data.get_string_from_utf8()
	print("Received: ", text)
	
	var json = JSON.new()
	var parse_result = json.parse(text)
	
	if parse_result == OK:
		var command = json.data
		_process_command(peer, command)
	else:
		print("Failed to parse JSON: ", json.get_error_message())

func _process_command(peer: WebSocketPeer, command: Dictionary):
	var success = true
	var results = {}

	# Handle MCP-style commands
	var command_id = command.get("commandId", "")
	if command.has("type") and command.get("type") == "avatar_control":
		var params = command.get("params", {})
		command = params  # Unwrap the params
	
	# Process clip (body animation)
	if command.has("clip") and not command.get("clip", "").is_empty():
		var clip = command.get("clip")
		if _play_animation(clip):
			results["animation"] = clip
		else:
			success = false
			results["animation_error"] = "Animation not found: " + clip
	
	# Process emotion (facial expression)
	if command.has("emotion") and not command.get("emotion", "").is_empty():
		var emotion = command.get("emotion")
		if _set_emotion(emotion):
			results["emotion"] = emotion
		else:
			success = false
			results["emotion_error"] = "Emotion not found: " + emotion
	
	# Process look direction
	if command.has("lookAt") and not command.get("lookAt", "").is_empty():
		var look_at = command.get("lookAt")
		if _set_look_direction(look_at):
			results["lookAt"] = look_at
		else:
			results["lookAt_warning"] = "Look direction not found: " + look_at
	
	# Send response if command has an ID
	if not command_id.is_empty():
		var response = {
			"status": "success" if success else "partial",
			"result": results,
			"commandId": command_id
		}
		peer.send_text(JSON.stringify(response))

func _play_animation(clip_name: String) -> bool:
	if not animation_player:
		return false

	# Check if we have a mapping for this animation
	if not clip_name in animation_mappings:
		push_warning("No mapping for animation: " + clip_name)
		return false

	var anim_name = animation_mappings[clip_name]

	# Check if the animation exists
	if not animation_player.has_animation(anim_name):
		push_warning("Animation not found: " + anim_name)

		# Try without the library prefix
		var simple_name = anim_name.split("/")[-1]
		if animation_player.has_animation(simple_name):
			anim_name = simple_name
		else:
			return false

	# Determine animation type before playing
	if clip_name in one_shot_animations:
		current_animation_type = "one_shot"
	else:
		current_animation_type = "looping"

	# Play the animation
	animation_player.play(anim_name)
	current_clip = clip_name
	current_locomotion_anim = anim_name  # Store the actual animation name
	print("Playing animation: ", anim_name, " (", current_animation_type, ")")

	return true

func _set_emotion(emotion_name: String) -> bool:
	if not animation_player:
		return false
	
	# Reset expression first
	if animation_player.has_animation("RESET"):
		animation_player.play("RESET")
		animation_player.advance(0.0)  # Apply immediately
	
	# Check if we have a mapping for this emotion
	if not emotion_name in emotion_mappings:
		push_warning("No mapping for emotion: " + emotion_name)
		return false
	
	var anim_name = emotion_mappings[emotion_name]
	
	# Check if the animation exists
	if not animation_player.has_animation(anim_name):
		push_warning("Emotion animation not found: " + anim_name)
		
		# Try without the library prefix
		var simple_name = anim_name.split("/")[-1]
		if animation_player.has_animation(simple_name):
			anim_name = simple_name
		else:
			return false
	
	# Play the emotion animation
	animation_player.play(anim_name)
	animation_player.advance(0.0)  # Apply immediately since these are state-based
	current_emotion = emotion_name
	print("Set emotion: ", anim_name)

	# Restart the locomotion animation if one is active
	# This is necessary because playing the emotion stops the locomotion
	if not current_locomotion_anim.is_empty():
		animation_player.play(current_locomotion_anim)
		print("Restarting locomotion: ", current_locomotion_anim)

	return true

func _set_look_direction(direction: String) -> bool:
	if not animation_player:
		return false
	
	# Check if we have a mapping for this direction
	if not direction in look_mappings:
		push_warning("No mapping for look direction: " + direction)
		return false
	
	var anim_name = look_mappings[direction]
	
	# Empty string means reset to looking forward
	if anim_name.is_empty():
		current_look = direction
		print("Look direction reset to forward")
		return true
	
	# Check if the animation exists
	if not animation_player.has_animation(anim_name):
		push_warning("Look animation not found: " + anim_name)
		
		# Try without the library prefix
		var simple_name = anim_name.split("/")[-1]
		if animation_player.has_animation(simple_name):
			anim_name = simple_name
		else:
			return false
	
	# Play the look animation
	animation_player.play(anim_name)
	animation_player.advance(0.0)  # Apply immediately since these are state-based
	current_look = direction
	print("Set look direction: ", anim_name)

	# Restart the locomotion animation if one is active
	# This is necessary because playing the look direction stops the locomotion
	if not current_locomotion_anim.is_empty():
		animation_player.play(current_locomotion_anim)
		print("Restarting locomotion: ", current_locomotion_anim)

	return true

# Helper function to play mouth shapes for lip sync (future use)
func _play_mouth_shape(shape: String):
	if shape in mouth_shapes and animation_player:
		var anim_name = mouth_shapes[shape]
		if animation_player.has_animation(anim_name):
			animation_player.play(anim_name)
			animation_player.advance(0.0)

# Helper function to trigger blink animation
func _blink():
	if animation_player and animation_player.has_animation("blink"):
		animation_player.play("blink")
		# Return to previous expression after blink
		await get_tree().create_timer(0.2).timeout
		if current_emotion in emotion_mappings:
			animation_player.play(emotion_mappings[current_emotion])
			animation_player.advance(0.0)
		# Restart locomotion after blink
		if not current_locomotion_anim.is_empty():
			animation_player.play(current_locomotion_anim)
