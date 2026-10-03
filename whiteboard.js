/**
 * InterviewIQ AI — System Design Interactive Whiteboard Canvas
 * Allows candidate to drag & drop microservices, databases, load balancers, and draw connections.
 */

export class SystemDesignWhiteboard {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };

    if (this.container) {
      this.render();
      this.bindEvents();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="whiteboard-card">
        <div class="whiteboard-toolbar">
          <span style="font-weight: 600; font-size: 0.9rem;">📐 System Design Architecture Board</span>
          <div class="wb-node-buttons">
            <button class="btn btn-sm btn-secondary add-wb-node" data-type="Client">📱 Client App</button>
            <button class="btn btn-sm btn-secondary add-wb-node" data-type="Gateway">🌐 API Gateway</button>
            <button class="btn btn-sm btn-secondary add-wb-node" data-type="Balancer">⚖️ Load Balancer</button>
            <button class="btn btn-sm btn-secondary add-wb-node" data-type="Service">⚙️ Microservice</button>
            <button class="btn btn-sm btn-secondary add-wb-node" data-type="Database">🗄️ DB / PostgreSQL</button>
            <button class="btn btn-sm btn-secondary add-wb-node" data-type="Cache">⚡ Redis Cache</button>
            <button class="btn btn-sm btn-danger" id="clearWbBtn">🗑️ Clear Canvas</button>
          </div>
        </div>

        <div id="wbCanvasArea" class="whiteboard-canvas-area">
          <svg id="wbConnectionsSvg" class="wb-connections-svg"></svg>
          <div id="wbNodesContainer" class="wb-nodes-container"></div>
        </div>
      </div>
    `;

    // Add initial default architecture setup
    this.addNode('Client', 40, 80);
    this.addNode('Gateway', 220, 80);
    this.addNode('Service', 400, 40);
    this.addNode('Database', 580, 40);
  }

  addNode(type, x, y) {
    const id = 'node_' + Date.now() + '_' + Math.floor(Math.random() * 100);
    const node = { id, type, x, y };
    this.nodes.push(node);
    this.drawNodes();
  }

  drawNodes() {
    const container = document.getElementById('wbNodesContainer');
    if (!container) return;

    container.innerHTML = this.nodes.map(n => `
      <div class="wb-node-item" id="${n.id}" style="left: ${n.x}px; top: ${n.y}px;" data-id="${n.id}">
        <span class="wb-node-icon">${this.getNodeIcon(n.type)}</span>
        <span class="wb-node-label">${n.type}</span>
      </div>
    `).join('');

    this.bindNodeDrag();
  }

  getNodeIcon(type) {
    switch (type) {
      case 'Client': return '📱';
      case 'Gateway': return '🌐';
      case 'Balancer': return '⚖️';
      case 'Service': return '⚙️';
      case 'Database': return '🗄️';
      case 'Cache': return '⚡';
      default: return '📦';
    }
  }

  bindNodeDrag() {
    const nodes = document.querySelectorAll('.wb-node-item');
    nodes.forEach(el => {
      el.addEventListener('mousedown', (e) => {
        const id = el.getAttribute('data-id');
        this.selectedNode = this.nodes.find(n => n.id === id);
        if (this.selectedNode) {
          this.isDragging = true;
          this.dragOffset = {
            x: e.clientX - this.selectedNode.x,
            y: e.clientY - this.selectedNode.y
          };
        }
      });
    });
  }

  bindEvents() {
    const canvasArea = document.getElementById('wbCanvasArea');
    const clearBtn = document.getElementById('clearWbBtn');

    if (canvasArea) {
      canvasArea.addEventListener('mousemove', (e) => {
        if (this.isDragging && this.selectedNode) {
          const rect = canvasArea.getBoundingClientRect();
          this.selectedNode.x = Math.max(0, Math.min(e.clientX - this.dragOffset.x, rect.width - 120));
          this.selectedNode.y = Math.max(0, Math.min(e.clientY - this.dragOffset.y, rect.height - 60));
          
          const el = document.getElementById(this.selectedNode.id);
          if (el) {
            el.style.left = `${this.selectedNode.x}px`;
            el.style.top = `${this.selectedNode.y}px`;
          }
        }
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
        this.selectedNode = null;
      });
    }

    // Bind Add Buttons
    document.querySelectorAll('.add-wb-node').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.getAttribute('data-type');
        this.addNode(type, 150 + Math.random() * 200, 60 + Math.random() * 80);
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.nodes = [];
        this.drawNodes();
      });
    }
  }
}
