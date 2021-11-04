let scene, camera, renderer, controls;
let floorGeometry, floorMaterial, floor, skyboxGeo, skybox, myReq;
let zoomOut = false;
let autoRotate = true;
let flag = false;

var skyboxImageIndex = 0;
var skyboxImage = ["space", "mountain", "water", "lava", "mars", "temp1", "temp2"];
var levelIndex = 0;
var level = ["EASY", "NORMAL", "HARD"];

var mouseBtn;
var autoRotateBtn;
var zoomBtn;
var loading;

var mapLeftBtn;
var mapRightBtn;
var levelUpBtn;
var levelDownBtn;
var startBtn;

var restartBtn;
var gobackBtn;

var mapContent;
var levelContent;

var score;
var resultContent;

window.onload = function init() {
    /* canvas를 쓰나 안쓰나 똑같이 innerWidth, innerHeight에 화면 띄움 */
    // html파일에 canvas태그를 사용할 때 사용
    // canvas = document.getElementById("gl-canvas");
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;

    // renderer = new THREE.WebGLRenderer({ canvas });
    // renderer.setSize(canvas.width, canvas.height);

    // scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xffffff);

    // camera = new THREE.PerspectiveCamera(55, canvas.width / canvas.height, 45, 30000);
    // camera.position.set(0, -250, 2000);

    // html파일에 canvas를 안쓸 때 사용
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 45, 3000);
    camera.position.set(0, -250, 2000);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = "canvas";
    document.body.appendChild(renderer.domElement);

    // 배경 skybox 매트릭스 생성 및 scene에 추가함
    const materialArray = createMaterialArray(skyboxImage[skyboxImageIndex]);

    skyboxGeo = new THREE.BoxGeometry(1000, 1000, 1000);
    skybox = new THREE.Mesh(skyboxGeo, materialArray);
    scene.add(skybox);

    // 바닥 생성
    floorGeometry = new THREE.PlaneBufferGeometry(1000, 1000, 100, 100);
    // floorGeometry.translate(0, 0, -2450);
    floorMaterial = new THREE.MeshBasicMaterial();
    floorMaterial.color.set("gray");

    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    //controls 객체 생성 및 설정
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enabled = flag; //true면 마우스로 배경 회전 가능 (시작, 끝 화면은 배경이 돌아가기만 하고 직접 돌릴 수 없음)
    // controls.minDistance = 700; //enable이 true일 때 마우스 휠로 줌인 줌 아웃 최대, 최소 거리 설정
    controls.maxDistance = 150;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4; //배경화면 회전 속도

    mouseBtn = document.getElementById("canMove");
    autoRotateBtn = document.getElementById("autoRotate");
    zoomBtn = document.getElementById("zoom");
    loading = document.getElementById("loading");

    // mouseBtn.addEventListener("click", function () {
    //     flag = !flag;
    //     controls.enabled = flag;
    //     mouseBtn.textContent = flag ? "Mouse On" : "Mouse Off";
    // });
    // autoRotateBtn.addEventListener("click", function () {
    //     toggleAutoRotate(!autoRotate);
    // });
    // zoomBtn.addEventListener("click", function () {
    //     toggleZoom(!zoomOut);
    // });

    mapLeftBtn = document.getElementById("mapLeft");
    mapRightBtn = document.getElementById("mapRight");
    levelUpBtn = document.getElementById("levelUp");
    levelDownBtn = document.getElementById("levelDown");
    startBtn = document.getElementById("start");
    mapContent = document.getElementById("map");
    levelContent = document.getElementById("level");

    restartBtn = document.getElementById("reStart");
    gobackBtn = document.getElementById("goBack");
    resultContent = document.getElementById("resultContent");

    mapLeftBtn.addEventListener("click", function () {
        skyboxImageIndex += 6;
        skyboxImageIndex = skyboxImageIndex % 7;
        mapContent.textContent = skyboxImage[skyboxImageIndex];
        switchSkyBox(skyboxImage[skyboxImageIndex]);
    });
    mapRightBtn.addEventListener("click", function () {
        skyboxImageIndex += 1;
        skyboxImageIndex = skyboxImageIndex % 7;
        mapContent.textContent = skyboxImage[skyboxImageIndex];
        switchSkyBox(skyboxImage[skyboxImageIndex]);
    });
    levelUpBtn.addEventListener("click", function () {
        levelIndex += 1;
        levelIndex = levelIndex % 3;
        levelContent.textContent = level[levelIndex];
    });
    levelDownBtn.addEventListener("click", function () {
        levelIndex += 2;
        levelIndex = levelIndex % 3;
        levelContent.textContent = level[levelIndex];
    });
    startBtn.addEventListener("click", function () {
        document.getElementById("startId").style.display = "none";
        document.getElementById("instructions").style.display = "-webkit-box";

        //시작 설정 보여주는 것
        alert("Start!\nMap : " + mapContent.innerText + "\nLevel : " + levelContent.innerText);

        gameStart(levelIndex);
        return;
    });

    restartBtn.addEventListener("click", function () {
        alert("ReStart!\nMap : " + mapContent.innerText + "\nLevel : " + levelContent.innerText);

        score = Math.floor(Math.random() * 1000) + 1;
        var resultStr1 = "Score : " + score;
        var resultStr2 = "Level : " + level[levelIndex];
        resultContent.innerHTML = resultStr1 + "<br/>" + resultStr2;
    });
    gobackBtn.addEventListener("click", function () {
        levelIndex = 0;
        skyboxImageIndex = 0;
        mapContent.textContent = skyboxImage[skyboxImageIndex];
        switchSkyBox(skyboxImage[skyboxImageIndex]);
        levelContent.textContent = level[levelIndex];

        document.getElementById("startId").style.display = "block";
        document.getElementById("endId").style.display = "none";
    });

    window.addEventListener("resize", onWindowResize, false);
    animate();

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;

        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        controls.autoRotate = autoRotate;

        if (controls.maxDistance == 150 && zoomOut) {
            controls.maxDistance = 2000;
            camera.position.z = 2000;
        } else if (controls.maxDistance == 2000 && !zoomOut) {
            controls.maxDistance = 150;
            camera.position.z = 200;
        }
        // console.log(camera.position);

        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    function createPathStrings(filename) {
        const basePath = `./background/${filename}/`;
        const baseFilename = basePath + filename;
        const fileType = filename == "space" ? ".png" : filename == "temp2" ? ".bmp" : ".jpg";
        const sides = ["ft", "bk", "up", "dn", "rt", "lf"];
        const pathStings = sides.map((side) => {
            return baseFilename + "_" + side + fileType;
        });

        return pathStings;
    }

    function createMaterialArray(filename) {
        const skyboxImagepaths = createPathStrings(filename);
        const materialArray = skyboxImagepaths.map((image) => {
            let texture = new THREE.TextureLoader().load(image);

            return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
        });
        return materialArray;
    }

    function switchSkyBox(skyboxName) {
        scene.remove(skybox);
        skyboxImage[skyboxImageIndex] = skyboxName;
        const materialArray = createMaterialArray(skyboxImage[skyboxImageIndex]);

        skybox = new THREE.Mesh(skyboxGeo, materialArray);
        scene.add(skybox);
    }

    function toggleAutoRotate(value) {
        autoRotate = value;
    }

    function toggleZoom(value) {
        zoomOut = value;
        zoomBtn.textContent = value ? "Inside Box" : "Outside Box";
        loading.style.display = value ? "none" : "show";
    }
};
