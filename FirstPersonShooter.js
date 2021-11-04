//이게 1인칭 시점 코드인데, 솔직히 이해는 완벽히는 못함.
THREE.FirstPersonControls = function (camera, MouseMoveSensitivity = 0.002, speed = 200.0, jumpHeight = 350.0, height = 20.0) {
    var scope = this; //사람
    // Models index

    scope.MouseMoveSensitivity = MouseMoveSensitivity;
    scope.speed = speed;
    scope.height = height;
    scope.jumpHeight = scope.height + jumpHeight;
    scope.click = false;

    var moveForward = false;
    var moveBackward = false;
    var moveLeft = false;
    var moveRight = false;
    var canJump = false;
    var run = false;

    var velocity = new THREE.Vector3();
    var direction = new THREE.Vector3();

    var prevTime = performance.now();

    camera.rotation.set(0, 0, 0);

    var pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    var yawObject = new THREE.Object3D();
    yawObject.position.y = 3;
    yawObject.add(pitchObject);

    var PI_2 = Math.PI / 2;

    //마우스 움직일때 이벤트
    var onMouseMove = function (event) {
        if (scope.enabled === false) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * scope.MouseMoveSensitivity;
        pitchObject.rotation.x -= movementY * scope.MouseMoveSensitivity;

        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
    };

    //키보드 눌릴때 이벤트
    // var onKeyDown = function (event) {
    //     if (scope.enabled === false) return;

    //     switch (event.keyCode) {
    //         case 38: // up
    //         case 87: // w
    //             moveForward = true;
    //             break;

    //         case 37: // left
    //         case 65: // a
    //             moveLeft = true;
    //             break;

    //         case 40: // down
    //         case 83: // s
    //             moveBackward = true;
    //             break;

    //         case 39: // right
    //         case 68: // d
    //             moveRight = true;
    //             break;

    //         case 32: // space
    //             if (canJump === true) velocity.y += run === false ? scope.jumpHeight : scope.jumpHeight + 50;
    //             canJump = false;
    //             break;

    //         case 16: // shift
    //             run = true;
    //             break;
    //     }
    // }.bind(this);

    // //키보드 땔때 이벤트
    // var onKeyUp = function (event) {
    //     if (scope.enabled === false) return;

    //     switch (event.keyCode) {
    //         case 38: // up
    //         case 87: // w
    //             moveForward = false;
    //             break;

    //         case 37: // left
    //         case 65: // a
    //             moveLeft = false;
    //             break;

    //         case 40: // down
    //         case 83: // s
    //             moveBackward = false;
    //             break;

    //         case 39: // right
    //         case 68: // d
    //             moveRight = false;
    //             break;

    //         case 16: // shift
    //             run = false;
    //             break;
    //     }
    // }.bind(this);

    //마우스 눌를때 이벤트
    var onMouseDownClick = function (event) {
        if (scope.enabled === false) return;
        scope.click = true;
    }.bind(this);
    //마우스 땔때 이벤트
    var onMouseUpClick = function (event) {
        if (scope.enabled === false) return;
        scope.click = false;
    }.bind(this);

    scope.dispose = function () {
        document.removeEventListener("mousemove", onMouseMove, false);
        // document.removeEventListener("keydown", onKeyDown, false);
        // document.removeEventListener("keyup", onKeyUp, false);
        document.removeEventListener("mousedown", onMouseDownClick, false);
        document.removeEventListener("mouseup", onMouseUpClick, false);
    };

    //이벤트 추가
    document.addEventListener("mousemove", onMouseMove, false);
    // document.addEventListener("keydown", onKeyDown, false);
    // document.addEventListener("keyup", onKeyUp, false);
    document.addEventListener("mousedown", onMouseDownClick, false);
    document.addEventListener("mouseup", onMouseUpClick, false);

    scope.enabled = false;

    //1인칭 사람 불러오기
    scope.getObject = function () {
        return yawObject;
    };

    scope.getObject2 = function () {
        return pitchObject;
    };

    //1인칭 사람 설정 업데이트 함수
    scope.update = function () {
        var time = performance.now();
        var delta = (time - prevTime) / 1000;

        velocity.y -= 9.8 * 100.0 * delta;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        var currentSpeed = scope.speed;
        if (run && (moveForward || moveBackward || moveLeft || moveRight)) currentSpeed = currentSpeed + currentSpeed * 1.1;

        if (moveForward || moveBackward) velocity.z -= direction.z * currentSpeed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * currentSpeed * delta;

        scope.getObject().translateX(-velocity.x * delta);
        scope.getObject().translateZ(velocity.z * delta);

        scope.getObject().position.y += velocity.y * delta;

        //만약 업데이트된 사람 위치가 사람의 키보다 작을경우.
        if (scope.getObject().position.y < scope.height) {
            velocity.y = 0;
            scope.getObject().position.y = scope.height;

            canJump = true;
        }
        prevTime = time; //현재 시간 저장
    };
};

let instructions;
let clickCnt = 0;
//여기부터 물체 생성 및 맵 관련 코드들////////////////////
var raycaster, arrow, world, gun, clock;
// var camera, scene, renderer, controls;
var boxes = [];
// game();
// gamePageAnimate();

//프로그램 처음 시작될 때
function gameStart() {
    //마우스로 1인칭 고정하기, 이해는 잘못함...
    instructions = document.getElementById("instructions");
    console.log(instructions);
    var havePointerLock = "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document;
    if (havePointerLock) {
        var element = document.body;
        var pointerlockchange = function (event) {
            if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
                controls.enabled = true;
                instructions.style.display = "none";
            } else {
                controls.enabled = false;
                instructions.style.display = "-webkit-box";
            }
        };
        var pointerlockerror = function (event) {
            instructions.style.display = "none";
        };

        document.addEventListener("pointerlockchange", pointerlockchange, false);
        document.addEventListener("mozpointerlockchange", pointerlockchange, false);
        document.addEventListener("webkitpointerlockchange", pointerlockchange, false);
        document.addEventListener("pointerlockerror", pointerlockerror, false);
        document.addEventListener("mozpointerlockerror", pointerlockerror, false);
        document.addEventListener("webkitpointerlockerror", pointerlockerror, false);

        instructions.addEventListener(
            "click",
            function (event) {
                element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
                if (/Firefox/i.test(navigator.userAgent)) {
                    var fullscreenchange = function (event) {
                        if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
                            document.removeEventListener("fullscreenchange", fullscreenchange);
                            document.removeEventListener("mozfullscreenchange", fullscreenchange);
                            element.requestPointerLock();
                        }
                    };
                    document.addEventListener("fullscreenchange", fullscreenchange, false);
                    document.addEventListener("mozfullscreenchange", fullscreenchange, false);
                    element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
                    element.requestFullscreen();
                } else {
                    element.requestPointerLock();
                }
            },
            false
        );
    } else {
        instructions.innerHTML = "Your browser not suported PointerLock";
    }

    clock = new THREE.Clock();
    //카메라
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 30000);

    //물체 그룹
    world = new THREE.Group();

    //광선 투사 및 에임 생성 -> 이걸로 총 맞춤
    raycaster = new THREE.Raycaster(camera.getWorldPosition(new THREE.Vector3()), camera.getWorldDirection(new THREE.Vector3()));
    arrow = new THREE.ArrowHelper(camera.getWorldDirection(new THREE.Vector3()), camera.getWorldPosition(new THREE.Vector3()), 3, 0x000000);

    //화면 생성
    // scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xffffff);
    //화면 안개 생성
    // scene.fog = new THREE.Fog(0xffffff, 0, 2000);
    // scene.fog = new THREE.FogExp2 (0xffffff, 0.007);

    //랜더링 함수 생성
    // renderer = new THREE.WebGLRenderer({ antialias: true });
    // renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // renderer.shadowMap.enabled = true;
    // document.body.appendChild(renderer.domElement);
    // renderer.outputEncoding = THREE.sRGBEncoding;

    //화면 크기 맞춤 설정
    // window.addEventListener("resize", onWindowResize, false);

    //라이트 설정
    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0, 100, 0.4);
    scene.add(light);

    var dirLight = new THREE.SpotLight(0xffffff, 0.5, 0.0, 180.0);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(0, 300, 100);
    dirLight.castShadow = true;
    dirLight.lookAt(new THREE.Vector3());
    scene.add(dirLight);

    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.camera.far = 3000;

    //1인칭 사람 생성
    controls = new THREE.FirstPersonControls(camera);
    scene.add(controls.getObject());

    //object

    // Model/material loading! MTL Loader 부분 함수, 총을 mtl loader로 불러왔어요
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.load("models/uziGold.mtl", function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);

        objLoader.load("models/uziGold.obj", function (mesh) {
            gun = mesh;
            gun.traverse(function (node) {
                if (node instanceof THREE.Mesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            scene.add(gun);
            gun.scale.set(100, 100, 100);
            // gun.position.set(controls.getObject().position.x-5,controls.getObject().position.y,controls.getObject().position.z+5);
            gun.rotation.y;
        });
    });

    //이제 네모난 박스를 랜덤으로 생성하는 코드들
    var boxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);

    boxGeometry.translate(0, 0.5, 0);

    for (var i = 0; i < 500; i++) {
        var boxMaterial = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, flatShading: false, vertexColors: false });

        var mesh = new THREE.Mesh(boxGeometry, boxMaterial);
        mesh.position.x = Math.random() * 1000 - Math.random() * 1000;
        mesh.position.y = Math.random() * 20;
        mesh.position.z = Math.random() * 1000 - Math.random() * 1000;
        mesh.scale.x = 5;
        mesh.scale.y = 5;
        mesh.scale.z = 5;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        boxes.push(mesh);
        world.add(mesh);
    }

    scene.add(world);

    gamePageAnimate();
}

//화면 맞춤 함수
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

//애니메이션 함수,
function gamePageAnimate() {
    var time = Date.now() * 0.0005;
    var delta = clock.getDelta();
    requestAnimationFrame(gamePageAnimate);

    //만약 1인칭 사람이 정상적으로 생성됐다면,
    if (controls.enabled === true) {
        controls.update();
        raycaster.set(camera.getWorldPosition(new THREE.Vector3()), camera.getWorldDirection(new THREE.Vector3()));
        scene.remove(arrow);
        arrow = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 10, 0x111111);
        scene.add(arrow);
        // position the gun in front of the camera

        gun.position.set(
            controls.getObject().position.x - Math.sin(controls.getObject().rotation.y) * 7,
            controls.getObject().position.y - 6,
            controls.getObject().position.z - 1 - Math.cos(controls.getObject().rotation.y) * 7
        );
        gun.rotation.set(controls.getObject().rotation.x, controls.getObject().rotation.y + 3.2, controls.getObject2().rotation.z * 10);

        scene.add(gun);

        // for(var i=0;i<boxes.length;i++)
        // world.remove(boxes[i]);

        //마우스 클릭 하였을때, 총 쏘는 거
        if (controls.click === true) {
            const intersects = raycaster.intersectObjects(world.children);

            if (intersects.length > 0) {
                const intersect = intersects[0].object;
                intersect.material.color.set(0xffffff);
            }
            for (let k = 0; k < world.children.length; k++) {
                var mesh = world.children[k];
                var R = mesh.material.color.r;
                var G = mesh.material.color.g;
                var B = mesh.material.color.b;
                var RGB = mesh.material.color;
                console.log(R + G + B);
                if (R + G + B == 3) world.remove(mesh);
            }

            // // 총알 튀는거 표시

            // //파편 튀는거 표시
            // if (particles.length > 0) {
            //   makeParticles(intersects.material.position)
            //   var pLength = particles.length;
            //   while (pLength--) {
            //     particles[pLength].prototype.update(pLength);
            //   }
            // }
            controls.click = false;
        }
        // for(var i=0;i<boxes.length;i++)
        // world.add(boxes[i]);

        renderer.render(scene, camera);
    }
}

//총알 파편튀는 코드인데 일단 제외했음
var particles = new Array();

//파편 튀는 함수
function makeParticles(intersectPosition) {
    var totalParticles = 80;

    var pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.oldvertices = []; //파편 포인트
    pointsGeometry.vertices = [];
    var colors = [];
    for (var i = 0; i < totalParticles; i++) {
        var position = randomPosition(Math.random());
        var vertex = new THREE.Vector3(position[0], position[1], position[2]);
        pointsGeometry.oldvertices.push([0, 0, 0]);
        pointsGeometry.vertices.push(vertex);

        var color = new THREE.Color(Math.random() * 0xffffff);
        colors.push(color);
    }
    pointsGeometry.colors = colors;

    var pointsMaterial = new THREE.PointsMaterial({
        size: 0.8,
        sizeAttenuation: true,
        depthWrite: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        vertexColors: THREE.VertexColors,
    });

    var points = new THREE.Points(pointsGeometry, pointsMaterial);

    points.prototype = Object.create(THREE.Points.prototype);
    points.position.x = intersectPosition.x;
    points.position.y = intersectPosition.y;
    points.position.z = intersectPosition.z;
    points.updateMatrix();
    points.matrixAutoUpdate = false;

    points.prototype.constructor = points;
    points.prototype.update = function (index) {
        var pCount = this.constructor.geometry.vertices.length;
        var positionYSum = 0;
        while (pCount--) {
            var position = this.constructor.geometry.vertices[pCount];
            var oldPosition = this.constructor.geometry.oldvertices[pCount];

            var velocity = {
                x: position.x - oldPosition[0],
                y: position.y - oldPosition[1],
                z: position.z - oldPosition[2],
            };

            var oldPositionX = position.x;
            var oldPositionY = position.y;
            var oldPositionZ = position.z;

            position.y -= 0.03; // gravity

            position.x += velocity.x;
            position.y += velocity.y;
            position.z += velocity.z;

            var wordlPosition = this.constructor.position.y + position.y;

            if (wordlPosition <= 0) {
                //particle touched the ground
                oldPositionY = position.y;
                position.y = oldPositionY - velocity.y * 0.3;

                positionYSum += 1;
            }

            this.constructor.geometry.oldvertices[pCount] = [oldPositionX, oldPositionY, oldPositionZ];
        }

        pointsGeometry.verticesNeedUpdate = true;

        if (positionYSum >= totalParticles) {
            particles.splice(index, 1);
            scene.remove(this.constructor);
            console.log("particle removed");
        }
    };
    particles.push(points);
    scene.add(points);
}

//랜덤으로 xyz 설정하는 함수

function randomPosition(radius) {
    radius = radius * Math.random();
    var theta = Math.random() * 2.0 * Math.PI;
    var phi = Math.random() * Math.PI;

    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);
    var sinPhi = Math.sin(phi);
    var cosPhi = Math.cos(phi);
    var x = radius * sinPhi * cosTheta;
    var y = radius * sinPhi * sinTheta;
    var z = radius * cosPhi;

    return [x, y, z];
}

//GUI 부분, 옆에 마우스 감도랑 사람 키, 점프 속도 설정하는 부분
// var Controlers = function () {
//     this.MouseMoveSensitivity = 0.002;
//     this.speed = 800.0;
//     this.jumpHeight = 350.0;
//     this.height = 30.0;
// };

// window.onload = function () {
//     var controler = new Controlers();
//     var gui = new dat.GUI();
//     gui.add(controler, "MouseMoveSensitivity", 0, 1)
//         .step(0.001)
//         .name("Mouse Sensitivity")
//         .onChange(function (value) {
//             controls.MouseMoveSensitivity = value;
//         });
//     gui.add(controler, "speed", 1, 8000)
//         .step(1)
//         .name("Speed")
//         .onChange(function (value) {
//             controls.speed = value;
//         });
//     gui.add(controler, "jumpHeight", 0, 2000)
//         .step(1)
//         .name("Jump Height")
//         .onChange(function (value) {
//             controls.jumpHeight = value;
//         });
//     gui.add(controler, "height", 1, 3000)
//         .step(1)
//         .name("Play Height")
//         .onChange(function (value) {
//             controls.height = value;
//             camera.updateProjectionMatrix();
//         });
// };
