import '../css/style.css';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import io from 'socket.io-client';
// import * as getIP from './utils/get-ip-addresses';

{
  let scene, WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, nPlane, fPlane, renderer, container, sea;

  let hemisphereLight, shadowLight;
  let wishlistData;
  let toDraw = `donut`;

  let controllerId;
  let controller;
  let socket;


  const init = () => {
    createScene();
    createLight();
    loadDict();
    loadAssets();
    loop();

  };


  const connect = () => {
    socket = io.connect('https://io-server-nxqgfvvqpl.now.sh');
    // socket = io.connect('http://localhost:8085');

    lookForPredictionInput();
  
    socket.on(`connectionUrl`, connectionUrl => {
    //   createQRCode();  
      // console.log(connectionUrl);
      console.log(`hello socket: u IP adress:8080/controller.html?id=${socket.id}`);
      // console.log(`hello socket: ${connectionUrl}/controller.html?id=${socket.id}`);
    });

    socket.on(`controllerConnected`, data => {
      console.log(`controller is connected`);
      controllerId = data;
      controllerIsConnected();
      socket.emit(`clientConnected`, controllerId, 'client connected');
    });
  
    socket.on(`update`, data => {
      console.log(`data from socket: ${data}`);
  
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

  const loadDict = () => {
    const loc = 'src/model2/class_names.txt';
    
    fetch(loc)
      .then(res => res.text()) // parse response as JSON (can be res.text() for plain response)
      .then(response => {
        wishlistData = response.split(/\n/);
        connect();
      })
      .catch(err => {
        console.log('u');
        alert('sorry, there are no results for your search');
      });
  
    console.log('ready to go');
  };


  const controllerIsConnected = () => {
    console.log(`the controller is connected`);
    startGame();
  };


  const startGame = () => {
    makeGiftCard();
  };


  const makeGiftCard = () => {
    // toDraw = wishlistData[Math.floor(Math.random() * wishlistData.length)];
    socket.emit(`giftToDraw`, controllerId, toDraw);
    console.log(toDraw);
  };

  const lookForPredictionInput = () => {
    socket.on(`prediction`, data => {
      data.suggestion.forEach(prediction => {
        toDraw === prediction ? renderGift() : console.log(`drawing is wrong`);
      });
    });
  };


  const renderGift = () => {
    console.log(`The drawing was right and now we can render the gift`);
    makeGiftCard();
  };

  const loadAssets = () => {
    console.log('loading models...');
    const loader = new GLTFLoader();
    loader.load('src/assets/models/cup_model.gltf', loadedModel);
  };

  const loadedModel = gltf => {
    console.log(gltf);
    scene.add(gltf.scene);
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