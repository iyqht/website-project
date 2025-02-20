import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "lil-gui";
import { gsap } from "gsap";

const renderer = new THREE.WebGLRenderer({
  canvas: document.body.querySelector("#solar"),
});

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000,
);

const control = new OrbitControls(camera, renderer.domElement);

camera.position.set(-60, 100, 100);
control.update();

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 5000, 1000);
scene.add(pointLight);

const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([
  "./assets/stars.jpg",
  "./assets/stars.jpg",
  "./assets/stars.jpg",
  "./assets/stars.jpg",
  "./assets/stars.jpg",
  "./assets/stars.jpg",
]);

const textureLoader = new THREE.TextureLoader();

const sunGeo = new THREE.SphereGeometry(24, 30, 30);
const sunMat = new THREE.MeshBasicMaterial({
  map: textureLoader.load("./assets/sun.jpg"),
});
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.name = "sun";
//scene.add(sun);

function createPlanete(name, size, texture, position, ring) {
  position *= 1.5;
  const geo = new THREE.SphereGeometry(size, 30, 30);
  const mat = new THREE.MeshStandardMaterial({
    map: textureLoader.load(texture.base),
  });
  const mesh = new THREE.Mesh(geo, mat);
  const obj = new THREE.Object3D();
  obj.add(mesh);
  if (texture.topo) {
    const geoTopo = new THREE.SphereGeometry(size + 0.05, 30, 30);
    const matTopo = new THREE.MeshStandardMaterial({
      alphaMap: textureLoader.load(texture.topo),
      transparent: true,
    });
    const meshTopo = new THREE.Mesh(geoTopo, matTopo);
    meshTopo.name = name;
    mesh.add(meshTopo);
  }
  const orbitGeo = new THREE.TorusGeometry(position, 0.2, 36);
  const orbitMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
  orbitMesh.rotation.x = -0.5 * Math.PI;
  scene.add(orbitMesh);

  if (ring) {
    const ringGeo = new THREE.RingGeometry(
      ring.innerRadius,
      ring.outerRadius,
      32,
    );
    const ringMat = new THREE.MeshBasicMaterial({
      map: textureLoader.load(ring.texture),
      side: THREE.DoubleSide,
      transparent: true,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    obj.add(ringMesh);
    ringMesh.position.x = position;
    ringMesh.rotation.x = -0.5 * Math.PI;
    ring.name = name;
  }
  //scene.add(obj);
  mesh.position.x = position;
  obj.name = name;
  mesh.name = name;
  return { mesh, obj };
}

const mercury = createPlanete(
  "mercury",
  3.2,
  { base: "./assets/mercury.jpg" },
  28,
);
const venus = createPlanete(
  "venus",
  5.8,
  { base: "./assets/venus_surface.jpg", topo: "./assets/venus_atmosphere.jpg" },
  44,
);
const earth = createPlanete(
  "earth",
  6,
  { base: "./assets/earth.png", topo: "./assets/clouds.jpg" },
  62,
);
const mars = createPlanete("mars", 4, { base: "./assets/mars.jpg" }, 78);
const jupiter = createPlanete(
  "jupiter",
  12,
  { base: "./assets/jupiter.jpg" },
  100,
);
const saturn = createPlanete(
  "saturn",
  10,
  { base: "./assets/saturn.jpg" },
  138,
  {
    innerRadius: 10,
    outerRadius: 20,
    texture: "./assets/saturn_ring.png",
  },
);
const uranus = createPlanete(
  "uranus",
  7,
  { base: "./assets/uranus.jpg" },
  176,
  {
    innerRadius: 7,
    outerRadius: 12,
    texture: "./assets/uranus_ring.png",
  },
);
const neptune = createPlanete(
  "neptune",
  7,
  { base: "./assets/neptune.jpg" },
  200,
);

const solarSystem = new THREE.Group();
solarSystem.add(
  sun,
  mercury.obj,
  venus.obj,
  earth.obj,
  mars.obj,
  jupiter.obj,
  saturn.obj,
  uranus.obj,
  neptune.obj,
);
scene.add(solarSystem);

//const p = document.createElement("p");
//p.className = "label";
//p.textContent = "Mercury"
//const pContainer = document.createElement("div");
//pContainer.appendChild(p);
//const pNameLabel = new CSS2DObject(pContainer);
//scene.add(pNameLabel);

function reveal(name) {
  const desc = document.getElementById(name);
  desc.classList.add("show");
}
function unreveal() {
  const desc = document.getElementsByClassName("desctext show");
  desc[0].classList.remove("show");
}
const mousePos = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener("click", function(e) {
  mousePos.x = (e.clientX / this.window.innerWidth) * 2 - 1;
  mousePos.y = -(e.clientY / this.window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mousePos, camera);
  const intersects = raycaster.intersectObjects(solarSystem.children);
  if (intersects.length > 0) {
    var tempV = new THREE.Box3().setFromObject(intersects[0].object);
    var center = tempV.getCenter(new THREE.Vector3());
    var size = tempV.getSize(new THREE.Vector3());
    console.log(tempV);
    gsap.to(camera.position, {
      x: center.x - 2 * size.x,
      y: center.y + 2 * size.y,
      z: center.z + 2 * size.z,
      duration: 1.5,
      ease: "none",
      onUpdate: function() {
        camera.lookAt(center);
        control.target = center;
        control.update();
      },
    });
    reveal(intersects[0].object.name);
  } else {
    unreveal();
  }
});

const gui = new GUI();
const options = {
  Light: false,
  Speed: 0,
};
gui.add(options, "Light").onChange(function(e) {
  ambientLight.intensity = e;
  ambientLight.color.set(0xffffff);
});
gui.add(options, "Speed", 0, 0.1);
let step = 0;

function animate() {
  step = options.Speed;
  //Self-rotation
  sun.rotateY(0.0004 + step);
  mercury.mesh.rotateY(0.0004 + step);
  venus.mesh.rotateY(0.0002 + step);
  earth.mesh.rotateY(0.002 + step);
  mars.mesh.rotateY(0.0018 + step);
  jupiter.mesh.rotateY(0.004 + step);
  saturn.mesh.rotateY(0.0038 + step);
  uranus.mesh.rotateY(0.003 + step);
  neptune.mesh.rotateY(0.0032 + step);

  //Around-sun-rotation
  mercury.obj.rotateY(0.004 + step);
  venus.obj.rotateY(0.0015 + step);
  earth.obj.rotateY(0.001 + step);
  mars.obj.rotateY(0.0008 + step);
  jupiter.obj.rotateY(0.0002 + step);
  saturn.obj.rotateY(0.00009 + step);
  uranus.obj.rotateY(0.00004 + step);
  neptune.obj.rotateY(0.00001 + step);

  //labelRenderer.render(scene, camera);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  //labelRenderer.setSize(this.window.innerWidth, this.window.innerHeight);
});
