import '../css/style.css';
import * as THREE from 'three';
import Sea from './classes/Sea';
import io from 'socket.io-client';

{
  let scene, WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, nPlane, fPlane, renderer, container, sea;

  let hemisphereLight, shadowLight;

  let controllerId;
  let controller;
  let socket;


  const init = () => {
    createScene();
    createSea();
    createLight();
    connect();
    loop();

  };


  const connect = () => {
    socket = io.connect('http://localhost:8085');
  
    socket.on(`connectionUrl`, connectionUrl => {
    //   createQRCode();  
      console.log(`hello socket: ${connectionUrl}/controller.html?id=${socket.id}`);
    });
  
    socket.on(`update`, data => {
      console.log(`data from socket: ${data}`);
  
    });

    
  
    socket.on(`connectiontest`, data => {
      controllerId = data;
      socket.emit(`connectiontest2`, controllerId, 'het werkt');
    });

    socket.on(`update`, data => {
      console.log('de data', data);
    });
  
  };
  
  const subscrideOnUpdate = () => {
    socket.on(`update`, data => {
      console.log('de data', data);
    });
  };

  const createSea = () => {
    sea = new Sea();
    sea.mesh.position.y = - 600;
    sea.mesh.position.x = 0;
    scene.add(sea.mesh);

    window.sea = sea;
  };


  const createLight = () => {
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);
    
    shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
    shadowLight.position.set(150, 350, 350);

    shadowLight.castShadow = true;
    shadowLight.shadow.camera.left = - 400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = - 400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;
    
    scene.add(hemisphereLight);
    scene.add(shadowLight);
  };


  const createScene = () => {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    scene = new THREE.Scene();
    
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
    
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nPlane = 1;
    fPlane = 10000;
    camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nPlane, fPlane);

    camera.position.x = 0;
    camera.position.y = 100;
    camera.position.z = 200;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });

    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.enabled = true;

    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', handleWindowResize, false);
  };

  function handleWindowResize() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
  }
  
  const loop =  () => {
    requestAnimationFrame(loop);
    
    renderer.render(scene, camera);
  };

  init();
}