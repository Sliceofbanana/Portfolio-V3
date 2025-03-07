'use strict';

// Function to create the canvas dynamically
function createCanvasBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'background';
    document.body.prepend(canvas);
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    return canvas;
}

// Initialize the WebGL shader
function initBackground() {
    const canvas = createCanvasBackground();
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        console.error('WebGL2 is not supported');
        return;
    }

    // Vertex Shader
    const vertexShaderSource = `#version 300 es
    precision mediump float;
    in vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }`;

    // Fragment Shader (Your Custom Shader)
    const fragmentShaderSource = `#version 300 es
    precision highp float;
    out vec4 O;
    uniform float time;
    uniform vec2 resolution;
    #define FC gl_FragCoord.xy
    #define R resolution
    #define MN min(R.x,R.y)
    #define T (time+660.)
    #define S smoothstep
    #define N normalize
    #define rot(a) mat2(cos((a)-vec4(0,11,33,0)))

    float rnd(vec2 p) {
        p = fract(p * vec2(12.9898, 78.233));
        p += dot(p, p + 34.56);
        return fract(p.x * p.y);
    }
    float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f), k = vec2(1, 0);
        float a = rnd(i);
        float b = rnd(i + k);
        float c = rnd(i + k.yx);
        float d = rnd(i + 1.);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    float fbm(vec2 p) {
        float t = .0, a = 1., h = .0; 
        mat2 m = mat2(1., -1.2, .2, 1.2);
        for (float i = .0; i < 5.; i++) {
            t += a * noise(p);
            p *= 2. * m;
            a *= .5;
            h += a;
        }
        return t / h;
    }
    void main() {
        vec2 uv = (FC - .5 * R) / R.y, k = vec2(0, T * .015); 
        vec3 col = vec3(1);
        uv.x += .25;
        uv *= vec2(2,1);
        float n = fbm(uv * .28 + vec2(-T * .01, 0));
        n = noise(uv * 3. + n * 2.);
        col.r -= fbm(uv + k + n);
        col.g -= fbm(uv * 1.003 + k + n + .003);
        col.b -= fbm(uv * 1.006 + k + n + .006);
        col = mix(col, vec3(1), dot(col, vec3(.21,.71,.07)));
        col = mix(vec3(.08), col, min(time * .1, 1.));
        col = clamp(col, .08, 1.);
        O = vec4(col, 1);
    }`;

    // Compile Shaders
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    // Link Shaders to Create Program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Set up full-screen quad
    const vertices = new Float32Array([
        -1, -1, 1, -1, -1, 1, 
        -1, 1, 1, -1, 1, 1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // Get Uniform Locations
    const timeUniform = gl.getUniformLocation(program, 'time');
    const resolutionUniform = gl.getUniformLocation(program, 'resolution');

    // Resize Canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Render Loop
    function render(now) {
        gl.uniform1f(timeUniform, now * 0.001);
        gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

// Run the background animation
initBackground();

//Opening or closing side bar
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

sidebarBtn.addEventListener("click", function() {elementToggleFunc(sidebar); })

//Activating Filter Select and filtering options

const select = document.querySelector('[data-select]');
const selectItems = document.querySelectorAll('[data-select-item]');
const selectValue = document.querySelector('[data-select-value]');
const filterBtn = document.querySelectorAll('[data-filter-btn]');

select.addEventListener('click', function () {elementToggleFunc(this); });

for(let i = 0; i < selectItems.length; i++) {
    selectItems[i].addEventListener('click', function() {

        let selectedValue = this.innerText.toLowerCase();
        selectValue.innerText = this.innerText;
        elementToggleFunc(select);
        filterFunc(selectedValue);

    });
}

const filterItems = document.querySelectorAll('[data-filter-item]');

const filterFunc = function (selectedValue) {

    filterItems.forEach(item => {
        let categories = item.dataset.category.split(",").map(category => category.trim());
        console.log("Item Categories:", categories); // Debugging

        if (selectedValue === "all" || categories.includes(selectedValue)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

//Enabling filter button for larger screens 

let lastClickedBtn = filterBtn[0];

filterBtn.forEach(button => {
    button.addEventListener("click", function () {
        let selectedValue = this.innerText.toLowerCase();

        selectValue.innerText = this.innerText;
        filterFunc(selectedValue);
    });
});

// Enabling Page Navigation 

const navigationLinks = document.querySelectorAll('[data-nav-link]');
const pages = document.querySelectorAll('[data-page]');

navigationLinks.forEach((navLink) => {
    navLink.addEventListener('click', function() {
        let selectedPage = this.getAttribute('data-nav-link'); // Get value from data-nav-link

        // Remove active class from all articles and nav links
        pages.forEach((page) => page.classList.remove('active'));
        navigationLinks.forEach((link) => link.classList.remove('active'));

        // Add active class to the matching article and clicked nav link
        pages.forEach((page) => {
            if (page.dataset.page === selectedPage) {
                page.classList.add('active');
            }
        });

        this.classList.add('active');

        // Scroll to top after navigation
        window.scrollTo(0, 0);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const lightbox = document.createElement("div");
    lightbox.classList.add("lightbox");
    document.body.appendChild(lightbox);

    const img = document.createElement("img");
    lightbox.appendChild(img);

    const closeBtn = document.createElement("span");
    closeBtn.classList.add("lightbox-close");
    closeBtn.innerHTML = "&times;";
    lightbox.appendChild(closeBtn);

    document.querySelectorAll(".cert-lightbox").forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            img.src = this.href;
            lightbox.classList.add("active");
        });
    });

    lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox || event.target === closeBtn) {
            lightbox.classList.remove("active");
        }
    });
});

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-DQPK1T2H31');