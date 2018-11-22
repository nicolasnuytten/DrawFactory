// import Sea from './classes/Sea.js';
// import Sky from './classes/Sky.js';
// import AirPlane from './classes/Airplane.js';

{

  let scene, WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, nPlane, fPlane, renderer, container;

  let hemisphereLight, shadowLight;


  const init = () => {
    createScene();
    createLight();

    loop();
  };


  const createLight = () => {
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);
    
    shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
    shadowLight.position.set(150, 350, 350);

    shadowLight.castShadow = true;
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
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