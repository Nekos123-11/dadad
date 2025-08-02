const canvas = document.getElementById('radarCanvas');
const ctx = canvas.getContext('2d');
const mapImage = new Image();
const mapSelector = document.getElementById('mapSelector');
const maps = {
    bureau: { name: "Bureau", imageUrl: "img/bureau_minimap.jpg", bounds: { xMin: 0, xMax: 500, yMin: 0, yMax: 500 } },
    plaza: { name: "Plaza", imageUrl: "img/plaza_minimap.jpg", bounds: { xMin: 0, xMax: 500, yMin: 0, yMax: 500 } },
    raid: { name: "Raid", imageUrl: "img/raid_minimap.jpg", bounds: { xMin: 0, xMax: 500, yMin: 0, yMax: 500 } },
    port: { name: "Port", imageUrl: "img/port_minimap.jpg", bounds: { xMin: 0, xMax: 500, yMin: 0, yMax: 500 } },
    canals: { name: "Canals", imageUrl: "img/canals_minimap.jpg", bounds: { xMin: 0, xMax: 500, yMin: 0, yMax: 500 } },
    grounded: { name: "Grounded", imageUrl: "img/grounded_minimap.jpg", bounds: { xMin: 0, xMax: 500, yMin: 0, yMax: 500 } },
    legacy: { name: "Legacy", imageUrl: "img/legacy_minimap.jpg", bounds: { xMin: 0, xMax: 500, yMin: 0, yMax: 500 } },
    castello: { name: "Castello", imageUrl: "img/castello_minimap.jpg", bounds: { xMin: 0, xMax: 500, yMin: 0, yMax: 500 } },
    soar: { name: "Soar", imageUrl: "img/soar_minimap.jpg", bounds: { xMin: 0, xMax: 500, yMin: 0, yMax: 500 } },
    village: { name: "Village", imageUrl: "img/village_minimap.jpg", bounds: { xMin: 0, xMax: 500, yMin: 0, yMax: 500 } }
};

let currentMapKey = localStorage.getItem('selectedMap') || 'bureau';
let players = {};
let isAnimationRunning = false;
let ws = null;
function initWebSocket() {
    const urlParams = new URLSearchParams(window.location.search);
    const wsHost = urlParams.get('host');
    
    if (!wsHost) {
        console.error('No WebSocket host provided');
        return;
    }
    ws = new WebSocket(wsHost);

    ws.onopen = () => {
        console.log('Connected to server');
    };

    ws.onclose = () => {
        console.log('Disconnected from server');
        setTimeout(initWebSocket, 5000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'positions') {
                updatePlayers(data.players);
            }
        } catch (error) {
            console.error('Error processing data:', error);
        }
    };
}

function updatePlayers(newPlayers) {
    players = {};
    newPlayers.forEach(player => {
        players[player.id] = player;
    });
}

function changeMap(mapKey) {
    currentMapKey = mapKey;
    localStorage.setItem('selectedMap', mapKey);
    mapImage.src = maps[currentMapKey].imageUrl;
    mapImage.onload = () => {
        console.log(`Map ${maps[currentMapKey].name} loaded.`);
        if (!isAnimationRunning) {
            animationLoop();
        }
    };
    mapImage.onerror = () => {
        console.error(`Failed to load map: ${maps[currentMapKey].imageUrl}`);
        ctx.fillStyle = '#ff4141';
        ctx.font = '20px Roboto Mono';
        ctx.textAlign = 'center';
        ctx.fillText('MAP LOADING ERROR', canvas.width / 2, canvas.height / 2);
    };
}

function drawRadar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
   
    const mapBounds = maps[currentMapKey].bounds;
    const mapWidth = mapBounds.xMax - mapBounds.xMin;
    const mapHeight = mapBounds.yMax - mapBounds.yMin;
    const canvasAspect = canvas.width / canvas.height;
    const mapAspect = mapWidth / mapHeight;
    
    let scaledWidth, scaledHeight, offsetX, offsetY;
    
    if (canvasAspect > mapAspect) {
        
        scaledHeight = canvas.height;
        scaledWidth = scaledHeight * mapAspect;
        offsetX = (canvas.width - scaledWidth) / 2;
        offsetY = 0;
    } else {

        scaledWidth = canvas.width;
        scaledHeight = scaledWidth / mapAspect;
        offsetX = 0;
        offsetY = (canvas.height - scaledHeight) / 2;
    }


    ctx.drawImage(mapImage, offsetX, offsetY, scaledWidth, scaledHeight);
    
    Object.values(players).forEach(player => {
        const normalizedX = (player.x - mapBounds.xMin) / mapWidth;
        const normalizedY = (player.y - mapBounds.yMin) / mapHeight;
        const scaledX = offsetX + (normalizedX * scaledWidth);
        const scaledY = offsetY + (normalizedY * scaledHeight);

        ctx.beginPath();
        ctx.arc(scaledX, scaledY, 4, 0, 2 * Math.PI, false);
        ctx.fillStyle = player.team === 'blue' ? 'rgba(0, 150, 255, 0.95)' : 'rgba(255, 50, 50, 0.95)';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'white';
        ctx.stroke();
    });
}

function animationLoop() {
    isAnimationRunning = true;
    drawRadar();
    requestAnimationFrame(animationLoop);
}

const mapPreviewBox = document.querySelector('.map-preview-box');
const currentMapDisplay = document.querySelector('.current-map-display');
currentMapDisplay.textContent = maps[currentMapKey].name;

mapPreviewBox.addEventListener('click', (e) => {
    if (!e.target.classList.contains('map-option')) {
        mapPreviewBox.classList.toggle('active');
    }
});

// Function to close all menus
function closeAllMenus() {
    document.querySelectorAll('.map-preview-box, .bg-preview-box').forEach(menu => {
        menu.classList.remove('active');
    });
}

// Add click event listener to the document to close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.map-preview-box') && !e.target.closest('.bg-preview-box')) {
        closeAllMenus();
    }
});

document.querySelectorAll('.map-option').forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        const mapKey = option.getAttribute('data-map');
        changeMap(mapKey);
        currentMapDisplay.textContent = maps[mapKey].name;
        closeAllMenus();
    });
});

const bgPreviewBox = document.querySelector('.bg-preview-box');
bgPreviewBox.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!e.target.classList.contains('bg-option')) {
        mapPreviewBox.classList.remove('active');
        bgPreviewBox.classList.toggle('active');
    }
});

const savedBg = localStorage.getItem('selectedBackground') || 'dark';
document.body.classList.remove('dark-bg', 'image-bg', 'jungle-bg');
document.body.classList.add(`${savedBg}-bg`);

document.querySelectorAll('.bg-option').forEach(option => {
    option.addEventListener('click', () => {
        const bgType = option.getAttribute('data-bg');
        document.body.classList.remove('dark-bg', 'image-bg', 'jungle-bg');
        document.body.classList.add(`${bgType}-bg`);
        localStorage.setItem('selectedBackground', bgType);
        // Close any open menus
        document.querySelectorAll('.active').forEach(menu => menu.classList.remove('active'));
    });
});

const discordLink = document.createElement('a');
discordLink.href = 'https://discord.gg/RFX5QJmt';
discordLink.target = '_blank';
discordLink.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: rgba(88, 101, 242, 0.1);
    border: 2px solid rgba(88, 101, 242, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    z-index: 1000;
`;
discordLink.innerHTML = '<svg width="25" height="20" viewBox="0 0 71 55" fill="#5865F2"><path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"/></svg>';
discordLink.onmouseover = () => {
    discordLink.style.transform = 'scale(1.05) translateY(-2px)';
    discordLink.style.boxShadow = '0 6px 20px rgba(88, 101, 242, 0.2)';
    discordLink.style.border = '2px solid rgba(88, 101, 242, 0.4)';
    discordLink.style.background = 'rgba(88, 101, 242, 0.15)';
};
discordLink.onmouseout = () => {
    discordLink.style.transform = 'scale(1) translateY(0)';
    discordLink.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    discordLink.style.border = '2px solid rgba(88, 101, 242, 0.2)';
    discordLink.style.background = 'rgba(88, 101, 242, 0.1)';
};
document.body.appendChild(discordLink);
if (mapSelector) {
    mapSelector.value = currentMapKey;
}
changeMap(currentMapKey);
initWebSocket();
