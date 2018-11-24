import * as THREE from 'three';
import Colors from './Colors';

class Sea {
  constructor() {
    //Geomotrie aanmken, een cilinder
    const geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

    geom.applyMatrix(new THREE.Matrix4().makeRotationX(- Math.PI / 2));

    //Alle punten die op 1 positie staan mergen
    geom.mergeVertices();

    this.waves = [];

    geom.vertices.forEach(vertex => {
      this.waves.push({
        x: vertex.x,
        y: vertex.y,
        z: vertex.z,
        ang: Math.random() * Math.PI * 2,
        amp: Math.random() * 15 + 5,
        speed: 0.016 + Math.random() * 0.032
      });
    });


    //Material aanmaken 
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.blue,
      transparent: true,
      flatShading: true
    });

    this.mesh = new THREE.Mesh(geom, mat);
  }


  moveWaves() {
    this.mesh.geometry.vertices.forEach((vertex, index) => {
      const wave = this.waves[index];

      //
      vertex.x = wave.x + Math.cos(wave.ang) + wave.amp;
      vertex.y = wave.y + Math.sin(wave.ang) * wave.amp;

      wave.ang += wave.speed;
    });

    this.mesh.geometry.verticesNeedUpdate = true;


    this.mesh.rotation.z += .005;
  }
}

export default Sea;