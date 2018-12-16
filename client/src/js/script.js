import '../css/index.css';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import io from 'socket.io-client';
import * as qrgen from 'qrcode-generator';
const random = require('random-name');
// import * as getIP from './utils/get-ip-addresses';

{
  let scene, WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, nPlane, fPlane, renderer, container;

  let hemisphereLight, shadowLight;
  let wishlistData;
  let toDraw;
  let giftNames;
  let getInputData = false;

  let controllerId;
  let socket;
  const gifts = [];
 
  const wishlistContainer = document.querySelector('.wishlist');
  const wishlistCard = document.querySelector('.wishlist-container');
  const wishOnCard = document.querySelector('.wish');
  const nameWishlist = document.querySelector('.name');


  const init = () => {
    createScene();
    createLight();
    loadDict();
    loop();
  };


  const connect = () => {
    // socket = io.connect('https://io-server-nxqgfvvqpl.now.sh');
    // socket = io.connect('https://io-server-nfmgfiicut.now.sh');
    // socket = io.connect('http://localhost:8085');
    socket = io.connect('https://io-server-gpyaypsyzu.now.sh');

    lookForPredictionInput();
  
    socket.on(`connectionUrl`, connectionUrl => {
    //   createQRCode();  
      // console.log(connectionUrl);
      // console.log(`hello socket: u IP adress:8080/controller.html?id=${socket.id}`);
      const qrcode = qrgen(5, `L`);
      qrcode.addData(`192.168.0.233:8080/controller.html?id=${socket.id}`);

      qrcode.make();
      document.querySelector(`.qrcode`).innerHTML = qrcode.createImgTag();
      
      document.querySelector('.link').href = `http://192.168.0.233:8080/controller.html?id=${socket.id}`;

      // console.log(qrcode);
      // console.log(`hello socket: ${connectionUrl}/controller.html?id=${socket.id}`);
    });

    socket.on(`controllerConnected`, data => {
      console.log(`controller is connected`);
      controllerId = data;
      controllerIsConnected();
      deleteStart();
      socket.emit(`clientConnected`, controllerId, 'client connected');
    });
  
    socket.on(`update`, data => {
      console.log(`data from socket: ${data}`);
  
    });

    socket.on(`update`, data => {
      console.log('de data', data);
    });
  
  };
  
  const loadDict = () => {
    const loc = 'data/gifts/gifts.txt';

    console.log(loc);
    
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

    fetch('data/gifts/gifts.json')
      .then(r => r.json())
      .then(
        data => giftNames = data
      );

    console.log(giftNames);
    console.log('ready to go');
  };

  const deleteStart = () => {
    const startField = document.querySelector('.start-screen');
    startField.style.display = 'none';
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
    const WishedGift = giftNames[toDraw].name;
    wishlistContainer.style.display = 'flex';
    wishlistCard.classList.add('show');
    wishOnCard.textContent = WishedGift;
    nameWishlist.textContent = `${random.first()}'s Wishlist`;

    socket.emit(`giftToDraw`, controllerId, WishedGift);
    getInputData = true;
    console.log(toDraw);
  };

  const lookForPredictionInput = () => {
    socket.on(`prediction`, data => {
      data.suggestion.forEach(prediction => {
        toDraw === prediction && getInputData ? renderGift(toDraw) : console.log(`drawing is wrong`);
      });
    });
  };

  const renderGift = gift => {
    getInputData = false;
    console.log(`The drawing was right and now we can render the gift`);
    socket.emit(`correctDrawing`, controllerId, `correctDrawing`);
    loadAssets(gift);
  };

  const loadAssets = gift => {
    console.log('loading model');
    const loader = new GLTFLoader().setPath('assets/models/');
    loader.load(`${gift}/${gift}.gltf`, loadedModel);
  };

  const loadedModel = gltf => {
    console.log(gltf);
    gltf.scene.scale.set(gltf.parser.json.extra.scale, gltf.parser.json.extra.scale, gltf.parser.json.extra.scale);
    
    gltf.scene.rotation.x = gltf.parser.json.extra.rotationX;
    gltf.scene.rotation.y = gltf.parser.json.extra.rotationY;
    gltf.scene.rotation.z = gltf.parser.json.extra.rotationZ;

    // const value = Math.random() * ((WIDTH / 2) - (- WIDTH / 2)) + (- WIDTH / 2); r
    // const value = ((Math.random() - .5) * WIDTH / 2);
    gltf.scene.position.z = - 290;
    gltf.scene.position.x = - 300;
    gltf.scene.position.y = 60;
    scene.add(gltf.scene);

    gifts.push(gltf);
    makeGiftCard();
    // console.log(gifts);
  };

  const createLight = () => {
    hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.7);
    
    shadowLight = new THREE.DirectionalLight(0xffffff, 0.7);
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
    
    // scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
    scene.background = new THREE.Color(0xa1c2ff);
    
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

    const loader = new GLTFLoader().setPath('assets/models/');
    loader.load(`scene.gltf`, function (gltf) {
      gltf.scene.scale.set(1, 1, 1);
      gltf.scene.position.x = - 50;
      gltf.scene.position.y = 150;
      gltf.scene.position.z = - 520;
      gltf.scene.rotation.x = 0;

      scene.add(gltf.scene);
      console.log('loaded scene');
      console.log(gltf);
    });
  };


  const handleWindowResize = () => {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
  };

  const gravity = () => {
    if (gifts) {
      gifts.forEach(gift => {
        // console.log(gift);
        if (gift.scene.position.x <= WIDTH / 2) {

          gift.scene.position.x += 2;
        }
      });
    }
  };
  
  const loop =  () => {
    requestAnimationFrame(loop);
    
    gravity();

    renderer.render(scene, camera);
  };

  init();
}