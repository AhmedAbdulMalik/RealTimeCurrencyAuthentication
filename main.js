import { ThreeMFLoader } from 'three/examples/jsm/Addons.js';
import './style.css'

import * as THREE from 'three';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight,0.1,1000);
//camera(field_of_view, aspect_ratio, view_frustum)

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight);
camera.position.setZ(30);



const geometry = new THREE.TorusGeometry(10,3,16,100);
//Torus i.e Donut uses (radius,tube, radialsegments, tubularsegments, arc)

const material = new THREE.MeshBasicMaterial({color: 0xFF6347, wireframe: true});
const torus = new THREE.Mesh(geometry,material);    

//finally making it visible
scene.add(torus);
//renderer==DRAW
renderer.render(scene,camera);
