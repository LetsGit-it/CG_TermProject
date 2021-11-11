let scene, camera, renderer, controls;
let floorGeometry, floorMaterial, floor, skyboxGeo, skybox, myReq;

var skyboxImageIndex = 0;
var skyboxImage = ["space", "water", "lava", "sunny1", "sunny2"];
var levelIndex = 0;
var level = ["EASY", "NORMAL", "HARD"];

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

    //controls 객체 생성 및 설정
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enabled = false; //true면 마우스로 배경 회전 가능 (시작, 끝 화면은 배경이 돌아가기만 하고 직접 돌릴 수 없음)
    controls.maxDistance = 150;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4; //배경화면 회전 속도

    loading = document.getElementById("loading");

    mapLeftBtn = document.getElementById("mapLeft");
    mapRightBtn = document.getElementById("mapRight");
    levelUpBtn = document.getElementById("levelUp");
    levelDownBtn = document.getElementById("levelDown");
    startBtn = document.getElementById("start");
    mapContent = document.getElementById("map");
    levelContent = document.getElementById("level");

    gobackBtn = document.getElementById("goBack");

    // 버튼 기능
    // 맵 선택 버튼
    mapLeftBtn.addEventListener("click", function () {
        skyboxImageIndex += 4;
        skyboxImageIndex = skyboxImageIndex % 5;
        mapContent.textContent = skyboxImage[skyboxImageIndex];
        switchSkyBox(skyboxImage[skyboxImageIndex]);
    });
    mapRightBtn.addEventListener("click", function () {
        skyboxImageIndex += 1;
        skyboxImageIndex = skyboxImageIndex % 5;
        mapContent.textContent = skyboxImage[skyboxImageIndex];
        switchSkyBox(skyboxImage[skyboxImageIndex]);
    });
    // 난이도 선택 버튼
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

    // 게임 시작 버튼
    startBtn.addEventListener("click", function () {
        document.getElementById("startId").style.display = "none";
        document.getElementById("instructions").style.display = "-webkit-box";

        //시작 설정 보여주는 것
        alert("Start!\nMap : " + mapContent.innerText + "\nLevel : " + levelContent.innerText);

        // 게임 시작 화면으로 넘어감
        gameStart(levelIndex);
    });

    // 게임 종료 & 처음화면으로 돌아가기 버튼
    gobackBtn.addEventListener("click", function () {
        levelIndex = 0;
        skyboxImageIndex = 0;
        mapContent.textContent = skyboxImage[skyboxImageIndex];
        switchSkyBox(skyboxImage[skyboxImageIndex]);
        levelContent.textContent = level[levelIndex];

        // document.getElementById("startId").style.display = "block";
        // document.getElementById("instructions").style.display = "none";
        // document.getElementById("endId").style.display = "none";
        location.reload();
    });

    // 화면 크기에 맞게 사이즈 조절됨
    window.addEventListener("resize", onWindowResize, false);

    // 시작 화면 애니메이션 함수
    animate();

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;

        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        // 배경화면 자동으로 회전
        controls.autoRotate = true;

        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    // 배경화면 생성 함수들 //
    function createPathStrings(filename) {
        const basePath = `./background/${filename}/`;
        const baseFilename = basePath + filename;
        const fileType = filename == "space" ? ".png" : filename == "sunny2" ? ".bmp" : ".jpg";
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
};
