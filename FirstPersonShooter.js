//이게 1인칭 시점 코드인데, 솔직히 이해는 완벽히는 못함.
THREE.FirstPersonControls = function (camera, MouseMoveSensitivity = 0.002, speed = 200.0, jumpHeight = 350.0, height = 20.0) {
    var scope = this;

    scope.MouseMoveSensitivity = MouseMoveSensitivity;
    scope.speed = speed;
    scope.height = height;
    scope.jumpHeight = scope.height + jumpHeight;
    scope.click = false;

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
        document.removeEventListener("mousedown", onMouseDownClick, false);
        document.removeEventListener("mouseup", onMouseUpClick, false);
    };

    //이벤트 추가
    document.addEventListener("mousemove", onMouseMove, false);
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

        direction.normalize();

        scope.getObject().translateX(-velocity.x * delta);
        scope.getObject().translateZ(velocity.z * delta);

        scope.getObject().position.y += velocity.y * delta;

        //만약 업데이트된 사람 위치가 사람의 키보다 작을경우.
        if (scope.getObject().position.y < scope.height) {
            velocity.y = 0;
            scope.getObject().position.y = scope.height;
        }
        prevTime = time; //현재 시간 저장
    };
};

//여기부터 물체 생성 및 맵 관련 코드들////////////////////
let instructions;
let clickCnt = 0;
var raycaster, arrow, world, gun, clock;

var pause = true;
var gameStarted = false;

clock = new THREE.Clock();

//프로그램 처음 시작될 때
function gameStart(level) {
    //마우스 감도 설정창 띄우기
    mouseGui();

    // 시간 & 점수 표시
    timerObject = document.getElementById("timer");
    timerObject.style.display = "block";

    scoreObject = document.getElementById("score");
    scoreObject.style.display = "block";

    validHitsObject = document.getElementById("validHitsPer");
    validHitsObject.style.display = "block";

    //마우스로 1인칭 고정하기, 이해는 잘못함...
    instructions = document.getElementById("instructions");
    isFinish = false;

    // 웹 브라우저마다 지원되는 PointerLock이 다릅니다. 어떤 브라우저인지 알아내어서 해당 브라우저의 PointerLock API를 사용 합니다.
    var havePointerLock = "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document;

    // PointerLock이 지원되는 브라우저가 맞다면, PointerLock 이벤트의 변화가 있을 경우 사용할 함수를 선언해 줍니다. 이는 나중에 eventlistener에 추가 됩니다.
    if (havePointerLock) {
        var element = document.body;
        var pointerlockchange = function (event) {
            if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
                pause = false;
                //console.log(pause);
                if (gameStarted == false) {
                    gameStarted = true;
                    startGame(level);
                }
                controls.enabled = true;
                instructions.style.display = "none";
            } else {
                if (isFinish == true) {
                    pause = true;
                    console.log("게임 종료");
                    controls.enabled = false;
                    instructions.style.display = "none";
                } else {
                    pause = true;
                    console.log("잠시 멈춤");
                    controls.enabled = false;
                    instructions.style.display = "-webkit-box";
                }
            }
        };
        // PointerLock에서 error가 발생할 경우의 함수를 작성해 줍니다. 이는 나중에 eventlistener에 추가 됩니다.
        var pointerlockerror = function (event) {
            instructions.style.display = "none";
        };

        // 위에서 선언한 pointerlockchange 함수와 pointerlockerror 함수를 addEventListener를 통해 이벤트를 받을 수 있도록 합니다.
        document.addEventListener("pointerlockchange", pointerlockchange, false);
        document.addEventListener("mozpointerlockchange", pointerlockchange, false);
        document.addEventListener("webkitpointerlockchange", pointerlockchange, false);
        document.addEventListener("pointerlockerror", pointerlockerror, false);
        document.addEventListener("mozpointerlockerror", pointerlockerror, false);
        document.addEventListener("webkitpointerlockerror", pointerlockerror, false);

        instructions.addEventListener(
            "click",
            function (event) {
                // 브라우저마다 지원되는 requestPointerLock이 다르기 때문에 || 연산자를 통해 맞는 브라우저의 requestPointerLock을 얻어 옵니다.
                element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
                element.requestPointerLock();
            },
            false
        );
    } else {
        instructions.innerHTML = "Your browser not suported PointerLock";
    }

    //카메라
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 30000);

    //물체 그룹
    world = new THREE.Group();

    //광선 투사 및 에임 생성 -> 이걸로 총 맞춤
    raycaster = new THREE.Raycaster(camera.getWorldPosition(new THREE.Vector3()), camera.getWorldDirection(new THREE.Vector3()));
    arrow = new THREE.ArrowHelper(camera.getWorldDirection(new THREE.Vector3()), camera.getWorldPosition(new THREE.Vector3()), 3, 0x000000);

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
            gun.scale.set(120, 120, 120);
            // gun.position.set(controls.getObject().position.x-5,controls.getObject().position.y+20,controls.getObject().position.z+5);
            gun.rotation.y;
        });
    });

    //물체 생성
    //구체 반지름
    var sphereRadius;
    //정육면체 너비
    var cubeWidth;
    //정육면체 높이
    var cubeHeight;
    //정육면체 깊이
    var cubeDepth;
    //정사면체 반지름
    var tetraRadius;
    var tetraDetail;

    var objects = [];
    var deletingTime = [];
    var worldObject;
    worldObject = new THREE.Group();
    var time = 60.0;

    var score = 0; //점수
    var totalHits = 0; //전체 타격수
    var validHits = 0; //유효 타격수(물체를 맞춘 경우)
    var validHitsPercentage = 0; //유효 타격율(타격 정확도)

    function startGame(level) {
        var mode = difficulty(level);

        //현재 일단은 5개만 띄우도록 설정
        for (var i = 0; i < 5; i++) {
            makeObject(mode);
        }
        startTimer(mode);
    }

    function startTimer(mode) {
        var createObjectTime = 0.0;
        var willDeleteTime = [];
        timer = setInterval(function () {
            if (time <= 0) {
                for (var i = 0; i < deletingTime.length; i++) {
                    deletingTime.shift();
                    deleteObj = objects[0];
                    worldObject.remove(deleteObj);
                    objects.shift();
                }
                finishTime();
            } else {
                if (pause == true) {
                } else {
                    if (createObjectTime == 0.5) {
                        createObjectTime = 0.0;
                        makeObject(mode);
                        //console.log("make");
                    }

                    //마우스 클릭 하였을때, 총 쏘는 거
                    if (controls.click === true) {
                        //마우스 클릭했을 때
                        totalHits++; //전체 타격수 (마우스 클릭할 때마다 1씩 증가)
                        console.log(totalHits);
                        const intersects = raycaster.intersectObjects(worldObject.children);
                        //raycaster를 쏘아서 맞는 object가 있으면 intersects 배열에 담음

                        if (intersects.length > 0) {
                            //raycaster에 맞은 object가 있다면
                            const intersect = intersects[0].object;
                            intersect.material.color.set(0xffffff); //빔에 맞은 object의 색을 흰색으로 변경시킴
                        }
                        for (let k = 0; k < worldObject.children.length; k++) {
                            var mesh = worldObject.children[k];
                            //console.log( objects[k].geometry.type);
                            var R = mesh.material.color.r;
                            var G = mesh.material.color.g;
                            var B = mesh.material.color.b;
                            var RGB = R + G + B;
                            //console.log(R + G + B);
                            if (RGB == 3) {
                                //빔에 맞은 object는 색이 흰색으로 변해서 R+G+B= 3
                                worldObject.remove(mesh); //빔에 맞으면 제거
                                //console.log( mesh.geometry.type);
                                //console.log( objects[k]);
                                var deletedObjType = mesh.geometry.type; //삭제되는 object의 타입
                                if (deletedObjType == "BoxGeometry") {
                                    //정육면체
                                    score += 30;
                                    scoreOutObject.innerText = "SCORE: " + score.toFixed(1);
                                }
                                if (deletedObjType == "IcosahedronGeometry") {
                                    //각진 구체
                                    score += 50;
                                    scoreOutObject.innerText = "SCORE: " + score.toFixed(1);
                                }

                                if (deletedObjType == "TetrahedronGeometry") {
                                    //정사면체
                                    score += 100;
                                    scoreOutObject.innerText = "SCORE: " + score.toFixed(1);
                                }

                                if (deletedObjType == "SphereGeometry") {
                                    //검은색 구체(폭탄)
                                    score -= 100;
                                    scoreOutObject.innerText = "SCORE: " + score.toFixed(1);
                                }

                                validHits++; //물체를 맞출 때마다 유효타격수 1씩 증가

                                console.log("Delete Success");
                            }
                        }
                        controls.click = false;
                    }

                    for (var i = 0; i < deletingTime.length; i++) {
                        if (deletingTime[i] >= time) {
                            deleteObj = objects[i];
                            worldObject.remove(deleteObj);
                            willDeleteTime.push(i);
                        }
                    }
                    //console.log(willDeleteTime);
                    for (var j = 0; j < willDeleteTime.length; j++) {
                        deletingTime.shift();
                        objects.shift();
                        //console.log("delete");
                    }
                    willDeleteTime = [];
                    time = time - 0.1;
                    timeObject.innerText = time.toFixed(1);
                    //console.log(time.toFixed(1));
                    createObjectTime = createObjectTime + 0.1;
                }
            }
        }, 100);
    }

    function makeObject(mode) {
        object = randomObject();
        drawObject(mode[object]);
    }

    function finishTime() {
        isFinish = true;
        document.exitPointerLock();
        document.getElementById("endId").style.display = "block";

        time = 0.0;
        timeObject.innerText = time.toFixed(1);
        clearInterval(timer);
        validHitsPercentage = (validHits / totalHits) * 100; //유효타격율 계산
        validHitsOutObject.innerText = "VALID HITS(%): " + validHitsPercentage.toFixed(1);
        console.log(validHitsPercentage + "%"); //게임이 종료될 때 계산됨
    }

    ////난이도 관련 코드
    //dif 1 = easy / 2 = normal / 3 = hard
    //array 0 = cube / 1 = sphere / 2 = theta / 3 = bomb
    function difficulty(dif) {
        //난이도 쉬움
        if (dif == 0) {
            sphereRadius = 0.4;
            cubeWidth = 0.6;
            cubeHeight = 0.6;
            cubeDepth = 0.6;
            tetraRadius = 0.5;
            tetraDetail = 0;
            //배열에 나타내고자 할 물체 나열
            var easyMode = new Float32Array([0, 0, 0, 0, 1, 1, 1, 2, 2, 2]);

            return easyMode;
        }
        //난이도 중간
        else if (dif == 1) {
            sphereRadius = 0.3;
            cubeWidth = 0.5;
            cubeHeight = 0.5;
            cubeDepth = 0.5;
            tetraRadius = 0.4;
            tetraDetail = 0;
            //배열에 나타내고자 할 물체 나열
            var normalMode = new Float32Array([0, 0, 0, 1, 1, 1, 2, 2, 2, 3]);

            return normalMode;
        }
        //난이도 어려움
        else {
            sphereRadius = 0.2;
            cubeWidth = 0.4;
            cubeHeight = 0.4;
            cubeDepth = 0.4;
            tetraRadius = 0.3;
            tetraDetail = 0;
            //배열에 나타내고자 할 물체 나열
            var hardMode = new Float32Array([0, 0, 1, 1, 1, 2, 2, 2, 3, 3]);

            return hardMode;
        }
    }
    ////난이도 관련 코드 끝

    //물체의 X좌표를 랜덤하게 가져오는 함수
    function randomLocationX() {
        var x = (Math.random() * 1000) % 20;
        //console.log(x - 4);
        return x - 10;
    }

    //물체의 Y좌표를 랜덤하게 가져오는 함수
    function randomLocationY() {
        var y = (Math.random() * 1000) % 10;
        //console.log(y - 2);
        return y + 20;
    }

    //앞서 배열에 10개가 들어있는데, 0 부터 9중 하나를 뽑아 리턴 해주는 함수
    //만약 5가 뽑혔다면, 5를 리턴해주고 해당배열중 5에 위치해있는 숫자에 해당하는 물체를 띄움
    function randomObject() {
        var objectType = Math.ceil((Math.random() * 1000) % 10) - 1;
        //console.log(objectType);

        return objectType;
    }

    //물체를 그리는 함수
    //함수에 인자가 0이 들어왔다면 정육면체 생성
    //인자가 1이 들어왔다면 구체 생성
    //인자가 2가 들어왔다면 정사면체 생성
    //인자가 3이 들어왔다면 폭탄 생성
    function drawObject(type) {
        if (type == 0) {
            createCube(cubeWidth, cubeHeight, cubeDepth);
        } else if (type == 1) {
            createSphere(sphereRadius);
        } else if (type == 2) {
            createTetrahedron(tetraRadius, tetraDetail);
        } else {
            createBomb(sphereRadius);
        }
    }

    //각진 구체 생성 함수
    function createSphere(sphereRadius) {
        //각진 구체 반지름 설정
        geometry = new THREE.IcosahedronGeometry(sphereRadius);
        //색상 지정
        material = new THREE.MeshPhongMaterial({ color: 0x00ffff });
        //구체 생성
        sphere = new THREE.Mesh(geometry, material);

        //구체의 위치값을 함수에서 받아와 무작위 위치 설정
        sphere.position.set(randomLocationX(), randomLocationY(), -20.0);
        sphere.rotation.x = 45;
        sphere.rotation.y = 45;
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        //화면에 추가
        objects.push(sphere);
        deletingTime.push(time - 4.0);
        worldObject.add(sphere);
    }

    function createCube(cubeWidth, cubeHeight, cubeDepth) {
        //정육면체 너비, 높이, 깊이 설정
        geometry = new THREE.BoxGeometry(cubeWidth, cubeHeight, cubeDepth);
        //색상 지정
        material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        //정육면체 생성
        cube = new THREE.Mesh(geometry, material);

        //정육면체의 위치값을 함수에서 받아와 무작위 위치 설정
        cube.position.set(randomLocationX(), randomLocationY(), -20.0);

        cube.rotation.x = 45;
        cube.rotation.y = 45;
        cube.castShadow = true;
        cube.receiveShadow = true;
        //화면에 추가
        objects.push(cube);
        deletingTime.push(time - 4.0);
        worldObject.add(cube);
    }

    function createTetrahedron(tetraRadius, tetraDetail) {
        //정사면체 반지름, detail 설정
        geometry = new THREE.TetrahedronGeometry(tetraRadius, tetraDetail);
        //색상 지정
        material = new THREE.MeshPhongMaterial({ color: 0xff00fe });
        //정사면체 생성
        tetrahedron = new THREE.Mesh(geometry, material);
        //정사면체의 위치값을 함수에서 받아와 무작위 위치 설정
        tetrahedron.position.set(randomLocationX(), randomLocationY(), -20.0);
        tetrahedron.rotation.x = 45;
        tetrahedron.rotation.y = 45;
        tetrahedron.castShadow = true;
        tetrahedron.receiveShadow = true;
        //화면에 추가
        objects.push(tetrahedron);
        deletingTime.push(time - 4.0);
        worldObject.add(tetrahedron);
    }

    function createBomb(sphereRadius) {
        segments = 32;
        //폭탄 반지름, 조각의 수 설정
        geometry = new THREE.SphereGeometry(sphereRadius, segments, segments);
        //폭탄 색상 지정
        material = new THREE.MeshPhongMaterial({ color: 0x000000 });
        //폭탄 생성
        bomb = new THREE.Mesh(geometry, material);

        //폭탄의 위치값을 함수에서 받아와 무작위 위치 설정
        bomb.position.set(randomLocationX(), randomLocationY(), -20.0);
        bomb.rotation.x = 45;
        bomb.rotation.y = 45;
        bomb.castShadow = true;
        bomb.receiveShadow = true;
        //화면에 추가
        objects.push(bomb);
        deletingTime.push(time - 4.0);
        worldObject.add(bomb);
    }

    scene.add(worldObject);

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
    requestAnimationFrame(gamePageAnimate);

    //만약 1인칭 사람이 정상적으로 생성됐다면,
    if (controls.enabled === true) {
        controls.update();
        raycaster.set(camera.getWorldPosition(new THREE.Vector3()), camera.getWorldDirection(new THREE.Vector3()));
        scene.remove(arrow);
        arrow = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 3, 0xffffff, 0.5, 0.05);
        scene.add(arrow);

        // position the gun in front of the camera
        gun.position.set(
            controls.getObject().position.x - Math.sin(controls.getObject().rotation.y) * 7,
            controls.getObject().position.y - 4,
            controls.getObject().position.z - 1 - Math.cos(controls.getObject().rotation.y) * 7
        );
        gun.rotation.set(controls.getObject().rotation.x, controls.getObject().rotation.y + 3.2, controls.getObject2().rotation.z * 10);

        scene.add(gun);

        renderer.render(scene, camera);
    }
}

//GUI 부분, 옆에 마우스 감도랑 사람 키, 점프 속도 설정하는 부분
var Controlers = function () {
    this.MouseMoveSensitivity = 0.002;
    this.speed = 800.0;
    this.jumpHeight = 350.0;
    this.height = 30.0;
};

var mouseGui = function () {
    var controler = new Controlers();
    var gui = new dat.GUI();
    gui.add(controler, "MouseMoveSensitivity", 0, 0.01)
        .step(0.0005)
        .name("Mouse Sensitivity")
        .onChange(function (value) {
            controls.MouseMoveSensitivity = value;
        });
};
