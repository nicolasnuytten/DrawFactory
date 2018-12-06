import '../css/index.css';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import io from 'socket.io-client';
import * as qrgen from 'qrcode-generator';
// import * as getIP from './utils/get-ip-addresses';

{
  let scene, WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, nPlane, fPlane, renderer, container;

  let hemisphereLight, shadowLight;
  let wishlistData;
  let toDraw;

  let controllerId;
  let socket;
  // let qr;


  const init = () => {
    createScene();
    createLight();
    loadDict();
    loop();

    // qr = new qrgen;

    // console.log(qr);

  };


  const connect = () => {
    socket = io.connect('https://io-server-nxqgfvvqpl.now.sh');
    // socket = io.connect('http://localhost:8085');

    lookForPredictionInput();
  
    socket.on(`connectionUrl`, connectionUrl => {
    //   createQRCode();  
      // console.log(connectionUrl);
      console.log(`hello socket: u IP adress:8080/controller.html?id=${socket.id}`);
      const qrcode = qrgen(5, `L`);
      qrcode.addData(`172.20.64.51:8080/controller.html?id=${socket.id}`);

      qrcode.make();
      document.querySelector(`.qrcode`).innerHTML = qrcode.createImgTag();

      console.log(qrcode);
      // console.log(`hello socket: ${connectionUrl}/controller.html?id=${socket.id}`);
    });

    socket.on(`controllerConnected`, data => {
      console.log(`controller is connected`);
      controllerId = data;
      controllerIsConnected();
      deleteQR();
      socket.emit(`clientConnected`, controllerId, 'client connected');
    });
  
    socket.on(`update`, data => {
      console.log(`data from socket: ${data}`);
  
    });

    socket.on(`update`, data => {
      console.log('de data', data);
    });
  
  };
  
  // const subscrideOnUpdate = () => {
  //   socket.on(`update`, data => {
  //     console.log('de data', data);
  //   });
  // };

  const loadDict = () => {
    const loc = 'src/gifts.txt';
    
    fetch(loc)
      .then(res => res.text()) // parse response as JSON (can be res.text() for plain response)
      .then(response => {
        wishlistData = response.split(/\n/);
        connect();
      })
      .catch(err => {
        console.log(err);
        alert('sorry, there are no results for your search');
      });
  
    console.log('ready to go');
  };

  const deleteQR = () => {
    const qrField = document.querySelector('.qrcode');
    qrField.style.display = 'none';
  };

  const controllerIsConnected = () => {
    console.log(`the controller is connected`);
    startGame();
  };


  const startGame = () => {
    makeGiftCard();
  };


  const makeGiftCard = () => {
    const toDrawPrev = toDraw;
    toDraw = wishlistData[Math.floor(Math.random() * wishlistData.length)];
    if (toDrawPrev === toDraw) {
      toDraw = wishlistData[Math.floor(Math.random() * wishlistData.length)];
    }
    socket.emit(`giftToDraw`, controllerId, toDraw);
    console.log(toDraw);
  };

  const lookForPredictionInput = () => {
    socket.on(`prediction`, data => {
      data.suggestion.forEach(prediction => {
        toDraw === prediction ? renderGift(toDraw) : console.log(`drawing is wrong`);
      });
    });
  };


  const renderGift = gift => {
    console.log(`The drawing was right and now we can render the gift`);
    makeGiftCard();
    loadAssets(gift);
  };

  const loadAssets = gift => {
    console.log('loading model');
    const loader = new GLTFLoader().setPath('src/assets/models/');
    loader.load(`${gift}/${gift}.gltf`, loadedModel);
  };

  const loadedModel = gltf => {
    console.log(gltf);
    gltf.scene.scale.x = 1;
    gltf.scene.scale.y = 1;
    gltf.scene.scale.z = 1;
    gltf.scene.position.z = - 200;
    gltf.scene.position.x = Math.random() * 200;
    gltf.scene.position.y = Math.random() * 200;
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