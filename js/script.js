// NODE.JS AND DATABASE SETUP -----------------------------------------------------

var mysql = require("mysql");

var con = mysql.createConnection({
  host: "localhost",
  user: "jacoshds_hexaia",
  password: "h3x414",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

// END OF NODE.JS AND DATABASE SETUP -----------------------------------------------------

window.onload = function () {
  // GAME CODE
  let currentTool = 0;
  let oldTool = 0;
  let currentUsername = localStorage.getItem("username");
  let playerCurrency;
  let controls;
  let renderer, camera, scene, raycaster, mouse, loader;
  let tiles = [];
  let tilePlacements = [];
  let tilePlacementsDisplayed = false;
  let state = `menu`; // menu, game
  let tilesetSize = 1;

  const HEX_FLATS = 1.732;
  const HEX_CORNERS = 2;

  if (localStorage.getItem("playerCurrency")) {
    playerCurrency = localStorage.getItem("playerCurrency");
  } else {
    playerCurrency = 15;
  }
  document.querySelector(".currency p").innerText = playerCurrency;

  startThreeJS();

  document.addEventListener("keyup", function () {
    if (event.keyCode === 13) {
      startGame();
    }
    if (event.keyCode === 32) {
    }
  });

  // function sendViaNode() {
  //   var send = { name: "John", age: 30, car: null };
  //   var sendString = JSON.stringify(send);
  //   alert(sendString);
  //   xhttp.send(send);
  // }

  document.querySelector(".form button").addEventListener("click", startGame);

  document.addEventListener("click", function () {
    // RAYCASTING
    event.preventDefault();

    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (tilePlacementsDisplayed) {
      let intersects = raycaster.intersectObjects(tilePlacements, true);

      if (intersects.length > 0) {
        if (playerCurrency >= 2) {
          // create new tile
          addModel(
            "mountain",
            "../assets/models/mountain.gltf",
            intersects[0].object.x,
            intersects[0].object.y,
            intersects[0].object.z,
            tiles
          );

          playerCurrency -= 2;
          localStorage.setItem("playerCurrency", playerCurrency);
          tilesetSize++;
          localStorage.setItem("tilesetSize", tilesetSize);

          setTimeout(function () {
            for (let i = 0; i < tiles.length; i++) {
              localStorage.setItem(
                "tileset" + i,
                JSON.stringify({
                  tileType: tiles[i].tileType,
                  path: tiles[i].path,
                  x: tiles[i].x,
                  y: tiles[i].y,
                  z: tiles[i].z,
                })
              );
            }
          }, 50);

          document.querySelector(".currency p").innerText = playerCurrency;
        } else {
          alert("Insufficient currency");
        }

        // remove available tile placement indicators
        for (let i = 0; i < tilePlacements.length; i++) {
          scene.remove(tilePlacements[i]);
        }
        tilePlacementsDisplayed = false;
      }
    }

    if (currentTool === 3) {
      let intersects = raycaster.intersectObjects(tiles, true);

      if (intersects.length > 0) {
        intersects[0].object.material = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
        });
      }
    }
  });

  document.addEventListener("wheel", function () {
    oldTool = currentTool;

    if (currentTool > 0 && event.deltaY < 0) {
      currentTool--;
      displayToolUI();
    } else if (currentTool < 4 && event.deltaY > 0) {
      currentTool++;
      displayToolUI();
    }

    selectTool();
  });

  if (currentUsername) {
    document.querySelector(".titleScreen").classList.add("removed");
    document.querySelector("header h3").innerText = currentUsername;
    startGame();
  }

  for (let i = 0; i < document.querySelectorAll(".tool").length; i++) {
    document
      .querySelectorAll(".tool")
      [i].addEventListener("click", function () {
        oldTool = currentTool;

        if (event.target.dataset.index !== undefined) {
          currentTool = parseInt(event.target.dataset.index);
          displayToolUI();
        } else {
          currentTool = parseInt(event.target.parentNode.dataset.index);
          displayToolUI();
        }

        selectTool();
      });
  }

  document.addEventListener("keydown", function () {
    oldTool = currentTool;

    if (event.keyCode === 49) {
      currentTool = 0;
      displayToolUI();
    } else if (event.keyCode === 50) {
      currentTool = 1;
      displayToolUI();
    } else if (event.keyCode === 51) {
      currentTool = 2;
      displayToolUI();
    } else if (event.keyCode === 52) {
      currentTool = 3;
      displayToolUI();
    } else if (event.keyCode === 53) {
      currentTool = 4;
      displayToolUI();
    } else if (event.keyCode === 77) {
      addModel("mountain", "../assets/models/mountain.gltf", 2, 0, 0, tiles);
    }

    selectTool();
  });

  document.getElementsByClassName("tools")[0].style.marginTop = "-58px";

  function startGame() {
    if (!currentUsername) {
      localStorage.setItem("username", document.querySelector("input").value);
    }

    fadeOut(document.getElementsByClassName("titleScreen")[0]);
    currentUsername = localStorage.getItem("username");
    document.querySelector("header h3").innerText = currentUsername;

    controls.enabled = true;
    state = `game`;
  }

  function selectTool() {
    // Unhighlight old tool
    for (let i = 0; i < document.querySelectorAll(`.tool`).length; i++) {
      fadeIn(document.querySelectorAll(`img`)[i * 2 + 1]);
      document.querySelectorAll(`img`)[(i + 1) * 2].classList.add("removed");
    }

    // Highlight new tool
    fadeIn(document.querySelectorAll(`img`)[(currentTool + 1) * 2]);
    document
      .querySelectorAll(`img`)
      [(currentTool + 1) * 2 - 1].classList.add("removed");

    // Set tool bar vertical alignment
    let currentMarginTop = document.getElementsByClassName("tools")[0].style
      .marginTop;
    document.getElementsByClassName(
      "tools"
    )[0].style.marginTop = `calc(${currentMarginTop} - ${
      84 * (currentTool - oldTool)
    }px)`;
  }

  function fadeIn(target) {
    target.classList.add("transitioning");
    target.classList.remove("hidden");
    target.classList.remove("removed");
  }

  function fadeOut(target) {
    target.classList.add("transitioning");
    target.classList.add("hidden");

    setTimeout(function () {
      target.classList.add("removed");
    }, 400);
  }

  function addModel(tileType, path, x, y, z, array) {
    loader.load(path, function (data) {
      data.scene.traverse(function (child) {
        if (child.isMesh) {
          child.tileType = tileType;
          child.path = path;
          child.x = x;
          child.y = y;
          child.z = z;
        }
      });

      let object = data.scene;

      object.position.set(x, y, z);
      object.tileType = tileType;
      object.path = path;
      object.x = x;
      object.y = y;
      object.z = z;

      scene.add(object);
      array.push(object);
    });
  }

  function displayToolUI() {
    // display TILE tool UI
    if (currentTool === 1 && !tilePlacementsDisplayed) {
      for (let i = 0; i < tiles.length; i++) {
        displayAvailableTilePlacements(tiles[i]);
      }
      tilePlacementsDisplayed = true;
    } else if (
      event.keyCode >= 49 &&
      event.keyCode <= 53 &&
      tilePlacementsDisplayed
    ) {
      for (let i = 0; i < tilePlacements.length; i++) {
        scene.remove(tilePlacements[i]);
      }
      tilePlacementsDisplayed = false;
    }

    // display PAINT tool UI
    // if (currentTool === 3) {
    //
    // }
  }

  function displayAvailableTilePlacements(target) {
    let adjacentTileOccupied1 = false;
    let adjacentTileOccupied2 = false;
    let adjacentTileOccupied3 = false;
    let adjacentTileOccupied4 = false;
    let adjacentTileOccupied5 = false;
    let adjacentTileOccupied6 = false;

    for (let j = 0; j < tiles.length; j++) {
      // FIRST ADJACENT TILE
      if (tiles[j].x === target.x + HEX_FLATS && tiles[j].z === target.z + 1) {
        adjacentTileOccupied1 = true;
      }

      // SECOND ADJACENT TILE
      if (tiles[j].x === target.x - HEX_FLATS && tiles[j].z === target.z + 1) {
        adjacentTileOccupied2 = true;
      }

      // THIRD ADJACENT TILE
      if (tiles[j].x === target.x && tiles[j].z === target.z + HEX_CORNERS) {
        adjacentTileOccupied3 = true;
      }

      // FOURTH ADJACENT TILE
      if (tiles[j].x === target.x && tiles[j].z === target.z - HEX_CORNERS) {
        adjacentTileOccupied4 = true;
      }

      // FIFTH ADJACENT TILE
      if (
        tiles[j].x === target.x - HEX_FLATS &&
        tiles[j].z === target.z - HEX_CORNERS / 2
      ) {
        adjacentTileOccupied5 = true;
      }

      // SIXTH ADJACENT TILE
      if (
        tiles[j].x === target.x + HEX_FLATS &&
        tiles[j].z === target.z - HEX_CORNERS / 2
      ) {
        adjacentTileOccupied6 = true;
      }
    }

    if (!adjacentTileOccupied1) {
      addModel(
        "water",
        "../assets/models/water.gltf",
        target.x + HEX_FLATS,
        0,
        target.z + 1,
        tilePlacements
      );
    }

    if (!adjacentTileOccupied2) {
      addModel(
        "water",
        "../assets/models/water.gltf",
        target.x - HEX_FLATS,
        0,
        target.z + 1,
        tilePlacements
      );
    }

    if (!adjacentTileOccupied3) {
      addModel(
        "water",
        "../assets/models/water.gltf",
        target.x,
        0,
        target.z + HEX_CORNERS,
        tilePlacements
      );
    }

    if (!adjacentTileOccupied4) {
      addModel(
        "water",
        "../assets/models/water.gltf",
        target.x,
        0,
        target.z - HEX_CORNERS,
        tilePlacements
      );
    }

    if (!adjacentTileOccupied5) {
      addModel(
        "water",
        "../assets/models/water.gltf",
        target.x - HEX_FLATS,
        0,
        target.z - HEX_CORNERS / 2,
        tilePlacements
      );
    }

    if (!adjacentTileOccupied6) {
      addModel(
        "water",
        "../assets/models/water.gltf",
        target.x + HEX_FLATS,
        0,
        target.z - HEX_CORNERS / 2,
        tilePlacements
      );
    }
  }

  function startThreeJS() {
    // STARTING CODE TAKEN FROM https://codepen.io/shshaw/pen/yPPOEg and then heavily modified

    const backgroundColor = 0x15131a;

    /*////////////////////////////////////////*/

    let renderCalls = [];
    function render() {
      requestAnimationFrame(render);
      renderCalls.forEach((callback) => {
        callback();
      });
    }
    render();

    /*////////////////////////////////////////*/

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(25, 10, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(backgroundColor); //0x );

    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = Math.pow(0.94, 5.0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    // window.addEventListener(
    //   "resize",
    //   function () {
    //     camera.aspect = window.innerWidth / window.innerHeight;
    //     camera.updateProjectionMatrix();
    //     renderer.setSize(window.innerWidth, window.innerHeight);
    //   },
    //   false
    // );

    document.body.appendChild(renderer.domElement);

    function renderScene() {
      renderer.render(scene, camera);
    }
    renderCalls.push(renderScene);

    /* ////////////////////////////////////////////////////////////////////////// */

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enabled = false;

    controls.movementSpeed = 10;
    controls.domElement = renderer.domElement;
    controls.rollSpeed = Math.PI / 6;
    controls.autoForward = false;
    controls.dragToLook = true;
    controls.enableZoom = false;

    camera.lookAt(0, -10, -0.75);

    // controls.enableDamping = true;
    // controls.enableZoom = true;
    // controls.keys = {
    //   LEFT: 65,
    //   UP: 87,
    //   RIGHT: 68,
    //   BOTTOM: 83,
    // };

    controls.dragToLook = false;

    // controls.rotateSpeed = 0.3;
    // controls.zoomSpeed = 0.9;
    //
    // controls.minDistance = 3;
    // controls.maxDistance = 20;
    //
    // controls.minPolarAngle = 0; // radians
    // controls.maxPolarAngle = Math.PI / 2; // radians
    //
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.05;

    renderCalls.push(function () {
      controls.update();
    });

    /* ////////////////////////////////////////////////////////////////////////// */

    var light = new THREE.PointLight(0x444444, 20, 100);
    light.position.set(4, 30, -20);
    scene.add(light);

    var light2 = new THREE.AmbientLight(0x202020, 20, 0.5);
    light2.position.set(30, -10, 30);
    scene.add(light2);

    /* ////////////////////////////////////////////////////////////////////////// */

    loader = new THREE.GLTFLoader();
    loader.crossOrigin = true;

    tilesetSize = localStorage.getItem("tilesetSize");
    if (tilesetSize) {
      for (let i = 0; i < tilesetSize; i++) {
        let tileset = [];
        tileset[i] = JSON.parse(localStorage.getItem("tileset" + i));
        console.log(tileset[i]);

        for (let i = 0; i < tilesetSize; i++) {
          if (tileset[i]) {
            addModel(
              tileset[i].tileType,
              tileset[i].path,
              tileset[i].x,
              tileset[i].y,
              tileset[i].z,
              tiles
            );
          }
        }
      }
    } else {
      addModel("mountain", "../assets/models/mountain.gltf", 0, 0, 0, tiles);
    }

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
  }
};
