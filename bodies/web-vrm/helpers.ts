import * as THREE from "three";
import type { VRM } from "@pixiv/three-vrm";

const _tgt = new THREE.Vector3(),
  _head = new THREE.Vector3();
const _pInv = new THREE.Quaternion(),
  _dir = new THREE.Vector3();
const _q = new THREE.Quaternion(),
  _e = new THREE.Euler(0, 0, 0, "YXZ");

const HEAD_FOLLOW = 0.5; // how much of the gaze the head takes
const MAX_YAW = THREE.MathUtils.degToRad(35); // don't let her do the Exorcist spin
const MAX_PITCH = THREE.MathUtils.degToRad(25);
const SMOOTH = 8; // higher = snappier, lower = languid

export function updateHead(vrm: VRM, target: THREE.Object3D, dt: number) {
  const head = vrm.humanoid.getNormalizedBoneNode("head");
  if (!head?.parent) return;

  target.getWorldPosition(_tgt);
  head.getWorldPosition(_head);
  head.parent.getWorldQuaternion(_pInv).invert();
  _dir.copy(_tgt).sub(_head).applyQuaternion(_pInv).normalize(); // head→target, parent-local

  const yaw = Math.atan2(_dir.x, _dir.z); // VRM faces +Z
  const pitch = Math.atan2(_dir.y, Math.hypot(_dir.x, _dir.z));

  _e.set(
    THREE.MathUtils.clamp(-pitch * HEAD_FOLLOW, -MAX_PITCH, MAX_PITCH),
    THREE.MathUtils.clamp(yaw * HEAD_FOLLOW, -MAX_YAW, MAX_YAW),
    0,
  );
  _q.setFromEuler(_e);
  head.quaternion.slerp(_q, 1 - Math.exp(-SMOOTH * dt)); // frame-rate-independent damping
}
