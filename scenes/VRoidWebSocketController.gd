extends Node3D
class_name VRoidWebSocketController

# WebSocket controller for VRoid character with dual animation system:
# - Global library: Facial expressions and look directions (state-based)
# - Locomotion library: Mixamo body animations (timeline-based)

@export_group("Character Components")
@export var animation_player: AnimationPlayer
@export var vrm_node: Node3D  # The root node of your VRM model

@export_group("WebSocket Settings")
@export var websocket_port: int = 8080
@export var auto_start: bool = true

# WebSocket server
var tcp_server := TCPServer.new()
var websocket_peers: Array[WebSocketPeer] = []

# Current state
var current_clip: String = "idle"
var current_emotion: String = "neutral"
var current_look: String = ""

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
	"neutral": "[Global]/neutral",
	"happy": "[Global]/happy",
	"sad": "[Global]/sad",
	"angry": "[Global]/angry",
	"surprised": "[Global]/surprised",
	"relaxed": "[Global]/relaxed",
	
	# Map additional MCP emotions to closest available
	"confused": "[Global]/surprised",
	"excited": "[Global]/happy",
	"bored": "[Global]/relaxed",
	"shy": "[Global]/sad",
	"confident": "[Global]/neutral"
}

# Look direction mappings
var look_mappings = {
	"down": "[Global]/lookDown",
	"left": "[Global]/lookLeft",
	"right": "[Global]/lookRight",
	"up": "[Global]/lookUp",
	"away": "[Global]/lookLeft",  # Default "away" to looking left
	"user": ""  # Empty means look forward (no specific animation)
}

# Mouth shape animations for lip sync (future use)
var mouth_shapes = {
	"aa": "[Global]/aa",
	"ee": "[Global]/ee",
	"ih": "[Global]/ih",
	"oh": "[Global]/oh",
	"ou": "[Global]/ou"
}

func _ready():
	print("VRoid WebSocket Controller starting...")
	
	if not animation_player:
		push_error("AnimationPlayer not assigned!")
		return
	
	# List available animations for debugging
	print("Available animations:")
	for anim in animation_player.get_animation_list():
		print("  - ", anim)
	
	if auto_start:
		start_server()
	
	# Set default state
	_play_animation("idle")
	_set_emotion("neutral")

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

func _process(_delta):
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

func _handle_new_connection(tcp_connection: StreamPeerTCP):
	var ws_peer = WebSocketPeer.new()
	var err = ws_peer.accept_stream(tcp_connection)
	
	if err == OK:
		websocket_peers.append(ws_peer)
		print("WebSocket client connected")
		
		# Send welcome with current state
		ws_peer.poll()
		if ws_peer.get_ready_state() == WebSocketPeer.STATE_OPEN:
			var welcome = {
				"type": "welcome",
				"message": "Connected to Live-Vroid",
				"state": {
					"animation": current_clip,
					"emotion": current_emotion,
					"lookAt": current_look
				}
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
	var command_id = command.get("commandId", "")
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
	
	# Play the animation
	animation_player.play(anim_name)
	current_clip = clip_name
	print("Playing animation: ", anim_name)
	
	# For one-shot animations, return to idle
	if clip_name in ["wave", "jump", "blow_kiss", "clap", "bow", "nod", "shake_head"]:
		# Wait for animation to complete then return to idle
		if animation_player.current_animation_length > 0:
			await get_tree().create_timer(animation_player.current_animation_length).timeout
			_play_animation("idle")
	
	return true

func _set_emotion(emotion_name: String) -> bool:
	if not animation_player:
		return false
	
	# Reset expression first
	if animation_player.has_animation("[Global]/RESET"):
		animation_player.play("[Global]/RESET")
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
	if animation_player and animation_player.has_animation("[Global]/blink"):
		animation_player.play("[Global]/blink")
		# Return to previous expression after blink
		await get_tree().create_timer(0.2).timeout
		if current_emotion in emotion_mappings:
			animation_player.play(emotion_mappings[current_emotion])
			animation_player.advance(0.0)
