import * as THREE from "https://unpkg.com/three@0.152.2/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.152.2/examples/jsm/controls/OrbitControls.js";

/* =======================================================
   Função padrão para criar cenas 3D
======================================================= */
function createScene(container) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);
    camera.position.set(0, 1.5, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x333333, 0.8);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    window.addEventListener("resize", () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w/h;
        camera.updateProjectionMatrix();
        renderer.setSize(w,h);
    });

    return { scene, camera, renderer, controls };
}

/* =======================================================
   MEMÓRIA RAM — MODELO 3D
======================================================= */
function initMemory3D() {
    const container = document.getElementById("memory3d");
    const { scene, camera, renderer, controls } = createScene(container);

    // PCB
    const pcb = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.14, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x065f46 })
    );
    scene.add(pcb);

    // Chips
    const chipMaterial = new THREE.MeshStandardMaterial({ color: 0x10b981 });
    for (let i = -3; i <= 3; i++) {
        const chip = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.08, 0.16),
            chipMaterial
        );
        chip.position.set(i * 0.32 * 0.8, 0.08, 0);
        scene.add(chip);
    }

    // Contatos
    const contacts = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.02, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xffd233, metalness: 1 })
    );
    contacts.position.set(0, -0.07, 0.18);
    scene.add(contacts);

    // Label
    const label = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.02, 0.36),
        new THREE.MeshStandardMaterial({ color: 0x0ea5a4 })
    );
    label.position.set(0.6, 0.08, -0.02);
    scene.add(label);

    // Animação
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        pcb.rotation.y = Math.sin(t * 0.25) * 0.05;

        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Interação: simular uso
    const useLabel = document.getElementById("memUsageLabel");
    const freeLabel = document.getElementById("memFreeLabel");

    document.getElementById("randomizeUsage").onclick = () => {
        const usage = Math.floor(Math.random() * 60) + 20;
        useLabel.textContent = usage + "%";
        freeLabel.textContent = (100 - usage) + "%";

        if (usage < 55) label.material.color.set("#10b981");
        else if (usage < 85) label.material.color.set("#f59e0b");
        else label.material.color.set("#ef4444");
    };
}

/* =======================================================
   CONTROLADOR 3D
======================================================= */
function initController3D() {
    const container = document.getElementById("controller3d");
    const { scene, camera, renderer, controls } = createScene(container);

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.18, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x1f2937 })
    );
    scene.add(body);

    // dissipador
    const heatMaterial = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 1
    });

    for (let i = -4; i <= 4; i++) {
        const rib = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.06, 0.85),
            heatMaterial
        );
        rib.position.set(i * 0.08, 0.1, 0);
        scene.add(rib);
    }

    // Portas
    const port = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.06, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xffd54f })
    );
    port.position.set(-0.6, -0.03, 0.35);
    scene.add(port);

    // LEDs
    const ledMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981
    });

    for (let i = 0; i < 3; i++) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.02), ledMat);
        led.position.set(0.5 - i * 0.09, 0.06, 0.44);
        scene.add(led);
    }

    function animate() {
        requestAnimationFrame(animate);
        body.rotation.y += 0.002;

        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

/* Inicialização */
window.addEventListener("DOMContentLoaded", () => {
    initMemory3D();
    initController3D();
});
