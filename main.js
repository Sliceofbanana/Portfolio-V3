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

// Load GTM when user interacts (clicks, or after 3s) - removed scroll to avoid conflicts
window.addEventListener("click", loadGTM, { once: true });
setTimeout(loadGTM, 3000);

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = {};
        
        // Handle regular fields
        for (let [key, value] of formData.entries()) {
            if (key === 'Goals[]') {
                // Handle checkbox array
                if (!data['Goals']) data['Goals'] = [];
                data['Goals'].push(value);
            } else {
                data[key] = value;
            }
        }
        
        // Convert Goals array to string for email
        if (data['Goals']) {
            data['Goals'] = data['Goals'].join(', ');
        }
        
        console.log('Form data being sent:', data);
        
        fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.success) {
                document.getElementById('thankYouModal').style.display = 'flex';
                this.reset();
            } else {
                alert('There was an error sending your message. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was an error sending your message. Please try again.');
        });
    });
}

// Close modal function
function closeThankYouModal() {
    document.getElementById('thankYouModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const landingPage = document.getElementById('landingPage');
    const mainContent = document.getElementById('mainContent');
    let isOnLandingPage = true;
    let scrollThreshold = 20; // Reduced threshold for easier triggering
    let isTransitioning = false;

    // Initially hide scrollbar on landing page
    document.body.style.overflow = 'hidden';

    // Simple scroll functionality - only transition from landing to main content
    window.addEventListener('scroll', function() {
        if (isTransitioning || !isOnLandingPage) return;
        
        const scrollY = window.scrollY;
        
        // Only scroll down to show main content
        if (scrollY > scrollThreshold) {
            showMainContent();
        }
    });

    function showMainContent() {
        if (isTransitioning || !isOnLandingPage) return;
        isTransitioning = true;
        isOnLandingPage = false;
        
        landingPage.classList.add('fade-out');
        
        setTimeout(() => {
            try {
                landingPage.style.display = 'none';
                mainContent.classList.remove('hidden');
                mainContent.classList.add('fade-in');
                document.body.style.overflow = 'auto';
                
                setTimeout(() => {
                    window.scrollTo(0, 0);
                    isTransitioning = false;
                }, 100);
            } catch (error) {
                isTransitioning = false;
            }
        }, 300);
    }

    // Prevent default scroll behavior when on landing page
    window.addEventListener('wheel', function(e) {
        if (isOnLandingPage && !isTransitioning) {
            // Allow scroll down to trigger transition
            if (e.deltaY > 0) {
                e.preventDefault();
                showMainContent();
            }
        }
    }, { passive: false });

    // Handle touch scrolling for mobile
    let touchStartY = 0;
    window.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    });

    window.addEventListener('touchmove', function(e) {
        if (isOnLandingPage && !isTransitioning) {
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;
            
            // Swipe up (scroll down)
            if (deltaY > 50) {
                e.preventDefault();
                showMainContent();
            }
        }
    }, { passive: false });
});

function showBodegaOptions() {
    const modal = document.getElementById('bodegaOptionsModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeBodegaOptions() {
    const modal = document.getElementById('bodegaOptionsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function goToLiveSite() {
    closeBodegaOptions();
    window.open('https://bodegacoworking.com/', '_blank');
}

function openCaseStudy(caseStudyId) {
    // Close the options modals first
    closeBodegaOptions();
    closeAcesphilsOptions();
    closeSpineOptions();
    
    const modal = document.getElementById('caseStudyModal');
    const content = document.getElementById('caseStudyContent');
    
    if (caseStudyId === 'bodega-coworking') {
        content.innerHTML = `
            <h2>Case Study: Building Bodega Coworking's Website from Scratch</h2>
            
            <section class="case-study-section">
                <h3>Project Overview</h3>
                <div class="project-details">
                    <p><strong>Client:</strong> Bodega Coworking Café – a community-centered coworking space and café in Cebu.</p>
                    <p><strong>Industry:</strong> Coworking, Hospitality, Community Spaces</p>
                    <p><strong>Project Goal:</strong> Design and develop a brand-new website from the ground up that enables event bookings & payments, private office listings, and meeting room reservations while capturing the brand's playful yet professional identity.</p>
                </div>
            </section>

            <section class="case-study-section">
                <h3>The Challenge</h3>
                <p>As a new and growing coworking brand, Bodega needed its first official website to:</p>
                <ul>
                    <li>Establish online credibility and visibility.</li>
                    <li>Allow customers to book and pay for events and meeting rooms.</li>
                    <li>Showcase private office availability in real time.</li>
                    <li>Reflect its identity as stylish, modern, playful, and community-driven.</li>
                </ul>
                <p>With no existing digital platform to build from, everything had to be designed and implemented from scratch — from branding and UI design to content structure and technical development.</p>
            </section>

            <section class="case-study-section">
                <h3>The Solution</h3>
                <p>I created a fully custom website tailored to Bodega's needs.</p>
                
                <h4>Key Deliverables</h4>
                
                <div class="deliverable">
                    <h5>User-Centered Information Architecture</h5>
                    <ul>
                        <li>Organized site into six core pages: Home, About, Membership, Events, Meeting Rooms, Private Offices.</li>
                        <li>Structured navigation inspired by Regus.com's clean topbar and Cinnamon.ph's organized event layout.</li>
                    </ul>
                </div>

                <div class="deliverable">
                    <h5>Event Booking & Payment Integration</h5>
                    <ul>
                        <li>Built a dedicated events section to showcase talks, socials, and workshops.</li>
                        <li>Integrated booking and online payment for seamless registration.</li>
                    </ul>
                </div>

                <div class="deliverable">
                    <h5>Private Office Listings</h5>
                    <ul>
                        <li>Designed a page showcasing available private offices with features and inclusions.</li>
                        <li>Added inquiry/booking functionality.</li>
                    </ul>
                </div>

                <div class="deliverable">
                    <h5>Meeting Room Reservations</h5>
                    <ul>
                        <li>Developed a booking system with pricing (e.g., hourly rates) and payment integration.</li>
                        <li>Clear call-to-actions for quick reservations.</li>
                    </ul>
                </div>

                <div class="deliverable">
                    <h5>Custom Design & Branding</h5>
                    <ul>
                        <li>Designed with a stylish, modern, simple, and playful aesthetic.</li>
                        <li>Balanced professional coworking branding with the cozy café vibe.</li>
                    </ul>
                </div>

                <div class="deliverable">
                    <h5>Mobile-First Development</h5>
                    <ul>
                        <li>Fully responsive layout ensuring usability across devices.</li>
                    </ul>
                </div>
            </section>

            <section class="case-study-section">
                <h3>The Results</h3>
                <ul>
                    <li><strong>From Zero to Full Platform</strong> – Bodega launched its first-ever digital presence.</li>
                    <li><strong>Streamlined Bookings</strong> – Users can now reserve events and meeting rooms online with ease.</li>
                    <li><strong>Community Growth</strong> – Clear event visibility improved attendance and engagement.</li>
                    <li><strong>Professional Branding</strong> – The website reflects the brand's vision: modern, stylish, and community-driven.</li>
                    <li><strong>Scalable Foundation</strong> – Built to support future expansion into new branches and services.</li>
                </ul>
            </section>

            <section class="case-study-section">
                <h3>Takeaway</h3>
                <p>This project shows how building a website from the ground up can transform a business from offline-only to digitally connected. For Bodega, it meant creating a platform that not only supports bookings but also builds a stronger sense of community.</p>
                
                <div class="case-study-cta">
                    <p><strong>Need a website built from scratch that's tailored to your business goals? Let's make it happen.</strong></p>
                    <a href="https://bodegacoworking.com/" target="_blank" class="view-live-btn">View Live Website</a>
                </div>
            </section>
        `;
    } else if (caseStudyId === 'acesphils-redesign') {
        content.innerHTML = `
            <h2>Case Study: Acesphils Hardware Website Design</h2>

<section class="case-study-section">
    <h3>Project Overview</h3>
    <div class="project-details">
        <p><strong>Client:</strong> Acesphils – A Philippine-based hardware store supplying tools, construction materials, and equipment.</p>
        <p><strong>Industry:</strong> Retail, Hardware, Construction</p>
        <p><strong>Project Goal:</strong> Create a modern, user-friendly website design that showcases hardware products, improves customer trust, and builds a stronger online presence.</p>
    </div>
</section>

<section class="case-study-section">
    <h3>The Challenge</h3>
    <p>Acesphils needed a complete design revamp of their online presence to:</p>
    <ul>
        <li>Modernize the look and feel of the website to reflect professionalism and reliability.</li>
        <li>Improve product visibility and navigation for customers looking for specific tools or equipment.</li>
        <li>Provide a scalable design that could support future e-commerce features.</li>
        <li>Build trust by creating a polished, consistent online brand identity.</li>
    </ul>
    <p>The previous website design was outdated, lacked hierarchy, and did not effectively highlight the store’s wide range of products.</p>
</section>

<section class="case-study-section">
    <h3>The Solution</h3>
    <p>I designed a clean, structured, and product-focused website interface that aligns with modern web standards.</p>
    
    <h4>Key Features Designed</h4>
    
    <div class="deliverable">
        <h5>Modern, Professional Look</h5>
        <ul>
            <li>Clean layouts with strong visual hierarchy for easy browsing.</li>
            <li>Hardware-focused design showcasing product categories and featured items.</li>
            <li>Use of consistent brand colors and typography for credibility.</li>
        </ul>
    </div>

    <div class="deliverable">
        <h5>Improved Navigation</h5>
        <ul>
            <li>Structured menus for product categories and services.</li>
            <li>Clear call-to-action areas for inquiries and customer engagement.</li>
            <li>Responsive layouts optimized for desktop, tablet, and mobile devices.</li>
        </ul>
    </div>

    <div class="deliverable">
        <h5>Future-Ready Design</h5>
        <ul>
            <li>Scalable structure prepared for possible e-commerce integration.</li>
            <li>Flexible product card designs for easy updates.</li>
            <li>Visually organized sections for About, Products, and Contact.</li>
        </ul>
    </div>
</section>

<section class="case-study-section">
    <h3>The Results</h3>
    <ul>
        <li><strong>Modern Web Identity</strong> – Revitalized the brand with a professional, hardware-focused website design.</li>
        <li><strong>Improved Usability</strong> – Simplified navigation that helps customers quickly find products.</li>
        <li><strong>Stronger Customer Trust</strong> – Clean and professional design builds credibility.</li>
        <li><strong>Scalable Foundation</strong> – Ready to expand into e-commerce and online product catalogs in the future.</li>
        <li><strong>Mobile Optimization</strong> – Fully responsive design ensuring smooth browsing on all devices.</li>
    </ul>
</section>
            <section class="case-study-section">
                <h3>Takeaway</h3>
                <p>This redesign project demonstrates how a complete website overhaul can revitalize a brand's online presence. For Acesphils, it meant creating a platform that truly represents the dynamic and modern nature of the Filipino gaming community.</p>
                
                <div class="case-study-cta">
                    <p><strong>Ready to transform your website with a modern, user-focused redesign? Let's create something amazing together.</strong></p>
                    <a href="https://acesphils.com/" target="_blank" class="view-live-btn">View Live Website</a>
                </div>
            </section>
        `;
    } else if (caseStudyId === 'spine-development') {
        content.innerHTML = `
            <h2>Case Study: Spine & Orthopaedics Cebu Website Development</h2>

            <section class="case-study-section">
                <h3>Project Overview</h3>
                <div class="project-details">
                    <p><strong>Client:</strong> Spine & Orthopaedics Cebu – A network of orthopedic specialists providing spine, joint, trauma, and sports injury care across Cebu.</p>
                    <p><strong>Industry:</strong> Healthcare, Medical Services</p>
                    <p><strong>Project Goal:</strong> Develop a responsive and informative website that highlights the clinic's specialists, services, and hospital locations while building credibility and accessibility for patients.</p>
                </div>
            </section>

            <section class="case-study-section">
                <h3>The Challenge</h3>
                <p>Spine & Orthopaedics Cebu required a professional online presence to:</p>
                <ul>
                    <li>Showcase medical specialists and their expertise.</li>
                    <li>Provide clear information on conditions treated and services offered.</li>
                    <li>Make hospital clinic locations easy to find and contact.</li>
                    <li>Integrate educational blogs and foundation initiatives to support patient awareness.</li>
                </ul>
                <p>The main challenge was to develop a structured, trustworthy website that could serve patients, partners, and researchers effectively.</p>
            </section>

            <section class="case-study-section">
                <h3>The Solution</h3>
                <p>I developed a fully responsive, content-rich website that communicates professionalism and medical authority.</p>
                
                <h4>Key Features Implemented</h4>
                
                <div class="deliverable">
                    <h5>Specialist Profiles</h5>
                    <ul>
                        <li>Dedicated pages for each doctor with bios, specialties, and contact options.</li>
                        <li>Clear calls-to-action to schedule consultations or learn more.</li>
                    </ul>
                </div>

                <div class="deliverable">
                    <h5>Conditions & Services</h5>
                    <ul>
                        <li>Informational sections explaining medical conditions and treatments offered.</li>
                        <li>Organized navigation for quick access to relevant health information.</li>
                    </ul>
                </div>

                <div class="deliverable">
                    <h5>Clinic Locations</h5>
                    <ul>
                        <li>Structured pages showing affiliated hospitals and clinic addresses.</li>
                        <li>Contact information and "Talk to Us" options for patient inquiries.</li>
                    </ul>
                </div>

                <div class="deliverable">
                    <h5>Educational Content</h5>
                    <ul>
                        <li>Integration of blogs and foundation initiatives to share updates and outreach activities.</li>
                        <li>Support for the clinic's mission of education and community service.</li>
                    </ul>
                </div>

                <div class="deliverable">
                    <h5>Responsive Design</h5>
                    <ul>
                        <li>Optimized for mobile, tablet, and desktop browsing.</li>
                        <li>Accessible design ensuring usability across all devices.</li>
                    </ul>
                </div>
            </section>

            <section class="case-study-section">
                <h3>The Results</h3>
                <ul>
                    <li><strong>Professional Online Presence</strong> – Built trust with patients and strengthened the clinic's digital identity.</li>
                    <li><strong>Improved Accessibility</strong> – Patients can now easily find doctors, services, and clinic locations.</li>
                    <li><strong>Educational Resource</strong> – Blogs and foundation pages provide ongoing value to the community.</li>
                    <li><strong>Optimized Performance</strong> – Fully responsive design ensures smooth navigation across devices.</li>
                    <li><strong>Patient Engagement</strong> – Clear CTAs and contact pathways increase inquiries and consultations.</li>
                </ul>
            </section>

            <section class="case-study-section">
                <h3>Takeaway</h3>
                <p>This development project demonstrates how a well-structured, responsive website can enhance a healthcare provider's credibility and accessibility. For Spine & Orthopaedics Cebu, it meant creating a digital platform that connects patients with the right specialists and provides valuable educational resources.</p>
                
                <div class="case-study-cta">
                    <p><strong>Looking to build a reliable, user-friendly website for your clinic or organization? Let's create a solution that meets your needs.</strong></p>
                    <a href="https://spineandorthocebu.com" target="_blank" class="view-live-btn">View Live Website</a>
                </div>
            </section>
        `;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeCaseStudy() {
    const modal = document.getElementById('caseStudyModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Acesphils Modal Functions
function showAcesphilsOptions() {
    const modal = document.getElementById('acesphilsOptionsModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeAcesphilsOptions() {
    const modal = document.getElementById('acesphilsOptionsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function goToAcesphilsLiveSite() {
    window.open('https://acesphils.com/', '_blank');
}

// Spine Options Modal Functions
function showSpineOptions() {
    const modal = document.getElementById('spineOptionsModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeSpineOptions() {
    const modal = document.getElementById('spineOptionsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function goToSpineLiveSite() {
    window.open('https://spineandorthocebu.com/', '_blank');
}

// Close modals when clicking outside
window.onclick = function(event) {
    const bodegaModal = document.getElementById('bodegaOptionsModal');
    const acesphilsModal = document.getElementById('acesphilsOptionsModal');
    const spineModal = document.getElementById('spineOptionsModal');
    const caseStudyModal = document.getElementById('caseStudyModal');
    
    if (event.target === bodegaModal) {
        closeBodegaOptions();
    }
    if (event.target === acesphilsModal) {
        closeAcesphilsOptions();
    }
    if (event.target === spineModal) {
        closeSpineOptions();
    }
    if (event.target === caseStudyModal) {
        closeCaseStudy();
    }
}