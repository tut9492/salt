class SaltShakerApp {
    constructor() {
        this.canvas = document.getElementById('pfpCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size to match CSS
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.dropzoneOverlay = document.getElementById('dropzoneOverlay');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // Disable image smoothing for pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        this.overlayImage = null;
        this.pfpImage = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadOverlayImage();
        this.drawInitialCanvas();
    }
    
    setupEventListeners() {
        // Canvas click to open file dialog
        this.canvas.addEventListener('click', () => {
            this.openFileDialog();
        });
        
        // Drag and drop
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.canvas.style.borderColor = '#ff7b98';
        });
        
        this.canvas.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.canvas.style.borderColor = '#333';
        });
        
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.style.borderColor = '#333';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
        
        // Paste from clipboard
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    this.handleFile(file);
                    break;
                }
            }
        });
        
        // Button events
        this.copyBtn.addEventListener('click', () => {
            this.copyToClipboard();
        });
        
        this.downloadBtn.addEventListener('click', () => {
            this.downloadImage();
        });
    }
    
    loadOverlayImage() {
        const overlay = new Image();
        overlay.onload = () => {
            this.overlayImage = overlay;
            this.redrawCanvas();
        };
        overlay.onerror = () => {
            console.warn('Overlay image not found, continuing without overlay');
        };
        overlay.src = 'overlay.png';
    }
    
    drawInitialCanvas() {
        // Clear canvas with black background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Show dropzone overlay
        this.dropzoneOverlay.classList.remove('hidden');
    }
    
    openFileDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        };
        input.click();
    }
    
    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.pfpImage = img;
                this.redrawCanvas();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    redrawCanvas() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.pfpImage) {
            // Hide dropzone overlay
            this.dropzoneOverlay.classList.add('hidden');
            
            // Draw PFP image to fit canvas (cover, square)
            this.drawImageToFit(this.pfpImage);
        } else {
            // Show dropzone overlay
            this.dropzoneOverlay.classList.remove('hidden');
        }
        
        // Draw overlay if available
        if (this.overlayImage) {
            this.ctx.drawImage(this.overlayImage, 0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    drawImageToFit(image) {
        const canvasAspect = this.canvas.width / this.canvas.height;
        const imageAspect = image.width / image.height;
        
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = image.width;
        let sourceHeight = image.height;
        
        if (imageAspect > canvasAspect) {
            // Image is wider than canvas, crop sides
            sourceWidth = image.height * canvasAspect;
            sourceX = (image.width - sourceWidth) / 2;
        } else {
            // Image is taller than canvas, crop top/bottom
            sourceHeight = image.width / canvasAspect;
            sourceY = (image.height - sourceHeight) / 2;
        }
        
        this.ctx.drawImage(
            image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, this.canvas.width, this.canvas.height
        );
    }
    
    async copyToClipboard() {
        try {
            // Create a new canvas for export (1024x1024)
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = 1024;
            exportCanvas.height = 1024;
            const exportCtx = exportCanvas.getContext('2d');
            
            // Disable smoothing for pixel art
            exportCtx.imageSmoothingEnabled = false;
            exportCtx.webkitImageSmoothingEnabled = false;
            exportCtx.mozImageSmoothingEnabled = false;
            exportCtx.msImageSmoothingEnabled = false;
            
            // Draw background
            exportCtx.fillStyle = '#000';
            exportCtx.fillRect(0, 0, 1024, 1024);
            
            // Draw PFP if available
            if (this.pfpImage) {
                this.drawImageToFitExport(this.pfpImage, exportCtx, 1024, 1024);
            }
            
            // Draw overlay if available
            if (this.overlayImage) {
                exportCtx.drawImage(this.overlayImage, 0, 0, 1024, 1024);
            }
            
            // Convert to blob and copy to clipboard
            exportCanvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    this.showNotification('Image copied to clipboard!');
                } catch (err) {
                    console.error('Failed to copy to clipboard:', err);
                    this.showNotification('Failed to copy to clipboard');
                }
            }, 'image/png');
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            this.showNotification('Failed to copy to clipboard');
        }
    }
    
    downloadImage() {
        try {
            // Create a new canvas for export (1024x1024)
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = 1024;
            exportCanvas.height = 1024;
            const exportCtx = exportCanvas.getContext('2d');
            
            // Disable smoothing for pixel art
            exportCtx.imageSmoothingEnabled = false;
            exportCtx.webkitImageSmoothingEnabled = false;
            exportCtx.mozImageSmoothingEnabled = false;
            exportCtx.msImageSmoothingEnabled = false;
            
            // Draw background
            exportCtx.fillStyle = '#000';
            exportCtx.fillRect(0, 0, 1024, 1024);
            
            // Draw PFP if available
            if (this.pfpImage) {
                this.drawImageToFitExport(this.pfpImage, exportCtx, 1024, 1024);
            }
            
            // Draw overlay if available
            if (this.overlayImage) {
                exportCtx.drawImage(this.overlayImage, 0, 0, 1024, 1024);
            }
            
            // Download the image
            const link = document.createElement('a');
            link.download = 'salt-shaker-pfp.png';
            link.href = exportCanvas.toDataURL('image/png');
            link.click();
            
            this.showNotification('Image downloaded!');
        } catch (err) {
            console.error('Error downloading image:', err);
            this.showNotification('Failed to download image');
        }
    }
    
    drawImageToFitExport(image, ctx, width, height) {
        const canvasAspect = width / height;
        const imageAspect = image.width / image.height;
        
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = image.width;
        let sourceHeight = image.height;
        
        if (imageAspect > canvasAspect) {
            // Image is wider than canvas, crop sides
            sourceWidth = image.height * canvasAspect;
            sourceX = (image.width - sourceWidth) / 2;
        } else {
            // Image is taller than canvas, crop top/bottom
            sourceHeight = image.width / canvasAspect;
            sourceY = (image.height - sourceHeight) / 2;
        }
        
        ctx.drawImage(
            image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, width, height
        );
    }
    
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ff7b98;
            color: #101010;
            padding: 10px 16px;
            border: 3px solid #000;
            border-radius: 0px;
            font-weight: normal;
            z-index: 1000;
            font-family: 'Press Start 2P', 'Courier New', monospace;
            font-size: 0.6rem;
            box-shadow: 3px 3px 0px #000;
            text-shadow: 1px 1px 0px rgba(255,255,255,0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SaltShakerApp();
});
