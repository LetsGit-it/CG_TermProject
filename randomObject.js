

window.onload = function init()
{
    const canvas = document.getElementById( "gl-canvas" );
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const renderer = new THREE.WebGLRenderer({canvas});
	renderer.setSize(canvas.clientWidth,canvas.clientHeight);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x999999);
	
	var camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 1000);
	camera.position.z = 10.0;

	scene.add(new THREE.AmbientLight(0x333333));
	
	var leftLight = new THREE.DirectionalLight(0xffffff, 1);
	leftLight.position.set(-5,3,3);
	scene.add(leftLight);
	
	var rightLight = new THREE.DirectionalLight(0xffffff, 1);
	rightLight.position.set(5,3,3);
	scene.add(rightLight);
	
    //구체 반지름
	var sphereRadius;
    //정육면체 너비
	var cubeWidth;
    //정육면체 높이
	var	cubeHeight;
    //정육면체 깊이
	var	cubeDepth;
    //정사면체 반지름
	var tetraRadius;
	var tetraDetail;

	var objects = [];
	var deletingTime = [];
	var worldObject;
	worldObject = new THREE.Group();

	//난이도 설정
	
	var time = 10.0;

	gameStart();

	function gameStart(){
		var mode = difficulty(3);

		//현재 일단은 5개만 띄우도록 설정
		for(var i = 0 ; i < 5 ; i ++){
			makeObject(mode);
		}

		startTimer(mode);
		
		animate();
	}

	function startTimer(mode){
		var createObjectTime = 0.0;
		var willDeleteTime = [];
		timer = setInterval(function(){
			if(time <= 0.0){
				for(var i = 0 ; i < deletingTime.length; i++){
					deletingTime.shift();
					deleteObj = objects[0];
					worldObject.remove(deleteObj);
					objects.shift();
				}
				finishTime();
			}
			else{
				if( createObjectTime == 0.5){
					createObjectTime = 0.0;
					makeObject(mode);
					console.log("make");
				}
				console.log(deletingTime.length);
				console.log(deletingTime);
				console.log(objects);
				console.log(worldObject);
				for(var i = 0 ; i < deletingTime.length; i++){
					if(deletingTime[i] >= time){
						deleteObj = objects[i];
						worldObject.remove(deleteObj);
						willDeleteTime.push(i);
					}
				}
				console.log(willDeleteTime);
				for(var j = 0 ; j < willDeleteTime.length ; j++){
					deletingTime.shift();
					objects.shift();
					console.log("delete");
				}
				willDeleteTime = [];
				out.innerText = time.toFixed(1);
				time = time - 0.1;
				createObjectTime = createObjectTime + 0.1;
			}
		}, 100);
	}

	

	function makeObject(mode){
		object = randomObject();
		drawObject(mode[object]);
	}

	function finishTime(){
		time = 0.0;
		out.innerText = time.toFixed(1);
		clearInterval(timer);
	}

	////난이도 관련 코드
	//dif 1 = easy / 2 = normal / 3 = hard
	//array 0 = cube / 1 = sphere / 2 = theta / 3 = bomb
	function difficulty(dif){
        //난이도 쉬움
		if(dif == 1){
			sphereRadius = 0.4;
			cubeWidth = 0.6;
			cubeHeight = 0.6;
			cubeDepth = 0.6;
			tetraRadius = 0.5;
			tetraDetail = 0;
			//배열에 나타내고자 할 물체 나열
			var easyMode = new Float32Array([0,0,0,0,1,1,1,2,2,2]);
			
			return easyMode;
		}
        //난이도 중간
		else if(dif == 2){
			sphereRadius = 0.3;
			cubeWidth = 0.5;
			cubeHeight = 0.5;
			cubeDepth = 0.5;
			tetraRadius = 0.4;
			tetraDetail = 0;
			//배열에 나타내고자 할 물체 나열
			var normalMode = new Float32Array([0,0,0,1,1,1,2,2,2,3]);

			return normalMode;
		}
        //난이도 어려움
		else{
			sphereRadius = 0.2;
			cubeWidth = 0.4;
			cubeHeight = 0.4;
			cubeDepth = 0.4;
			tetraRadius = 0.3;
			tetraDetail = 0;
			//배열에 나타내고자 할 물체 나열
			var hardMode = new Float32Array([0,0,1,1,1,2,2,2,3,3]);

			return hardMode;
		}
		
	}
	////난이도 관련 코드 끝
	
    ////화면에 나타나게 하는 애니메이션 코드
	function animate() {
		renderer.render(scene,camera);
		scene.add(worldObject);
		requestAnimationFrame(animate);
	}
	
    //물체의 X좌표를 랜덤하게 가져오는 함수
	function randomLocationX(){
		var x = (Math.random() * canvas.width) % 9;
		//console.log(x - 4);
		return x - 4
	}
	
    //물체의 Y좌표를 랜덤하게 가져오는 함수
	function randomLocationY(){
		var y = (Math.random() * canvas.height) % 5;
		//console.log(y - 2);
		return y - 2
	}
	
    //앞서 배열에 10개가 들어있는데, 0 부터 9중 하나를 뽑아 리턴 해주는 함수 
    //만약 5가 뽑혔다면, 5를 리턴해주고 해당배열중 5에 위치해있는 숫자에 해당하는 물체를 띄움
	function randomObject(){
		var objectType = Math.ceil((Math.random() * 1000) % 10) - 1;
		//console.log(objectType);
		
		return objectType;
		
	}
	
    //물체를 그리는 함수
    //함수에 인자가 0이 들어왔다면 정육면체 생성
    //인자가 1이 들어왔다면 구체 생성
    //인자가 2가 들어왔다면 정사면체 생성
    //인자가 3이 들어왔다면 폭탄 생성
	function drawObject(type){
		if(type == 0)
		{
			createCube(cubeWidth, cubeHeight, cubeDepth);
		}
		else if(type == 1)
		{
			createSphere(sphereRadius);
		}
		else if(type == 2)
		{
			createTetrahedron(tetraRadius, tetraDetail);
		}
		else
		{
			createBomb(sphereRadius);
		}	
	}
		
	//구체 생성 함수
	function createSphere(sphereRadius){
			
		segments = 32;
		//구체 반지름, 조각의 수 설정
		geometry = new THREE.SphereGeometry( sphereRadius, segments, segments );
        //색상 지정
		material = new THREE.MeshPhongMaterial( { color: 0x00ffff } );
        //구체 생성
		sphere = new THREE.Mesh( geometry, material );
		
        //구체의 위치값을 함수에서 받아와 무작위 위치 설정
		sphere.position.set(randomLocationX(),randomLocationY(),0.0);
		sphere.rotation.x = 45;
		sphere.rotation.y = 45;
        //화면에 추가
		objects.push(sphere);
		deletingTime.push((time - 4.0));
		worldObject.add( sphere );
		
	}
	
	function createCube(cubeWidth, cubeHeight, cubeDepth){

		//정육면체 너비, 높이, 깊이 설정
		geometry = new THREE.BoxGeometry( cubeWidth, cubeHeight, cubeDepth );
        //색상 지정
		material = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
        //정육면체 생성
		cube = new THREE.Mesh( geometry, material );
		
        //정육면체의 위치값을 함수에서 받아와 무작위 위치 설정
		cube.position.set(randomLocationX(),randomLocationY(),0.0);
		
		cube.rotation.x = 45;
		cube.rotation.y = 45;
        //화면에 추가
		objects.push(cube);
		deletingTime.push((time - 4.0));
		worldObject.add( cube );
		
	}
	
	function createTetrahedron(tetraRadius, tetraDetail){
		//정사면체 반지름, detail 설정
		geometry = new THREE.TetrahedronGeometry( tetraRadius, tetraDetail);
        //색상 지정
		material = new THREE.MeshPhongMaterial( { color: 0xff00fe } );
        //정사면체 생성
		tetrahedron = new THREE.Mesh( geometry, material );
		//정사면체의 위치값을 함수에서 받아와 무작위 위치 설정
		tetrahedron.position.set(randomLocationX(),randomLocationY(),0.0);
		tetrahedron.rotation.x = 45;
		tetrahedron.rotation.y = 45;
		//화면에 추가
		objects.push(tetrahedron);
		deletingTime.push((time - 4.0));
		worldObject.add( tetrahedron );
	}
	
	function createBomb(sphereRadius){
		segments = 32;
		//폭탄 반지름, 조각의 수 설정
		geometry = new THREE.SphereGeometry( sphereRadius, segments, segments );
        //폭탄 색상 지정
		material = new THREE.MeshPhongMaterial( { color: 0x000000} );
        //폭탄 생성
		bomb = new THREE.Mesh( geometry, material );
		
        //폭탄의 위치값을 함수에서 받아와 무작위 위치 설정
		bomb.position.set(randomLocationX(),randomLocationY(),0.0);
		bomb.rotation.x = 45;
		bomb.rotation.y = 45;
        //화면에 추가
		objects.push(bomb);
		deletingTime.push((time - 4.0));
		worldObject.add( bomb );
	}


}



