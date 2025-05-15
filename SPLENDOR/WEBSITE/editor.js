const client = new Appwrite.Client();
client
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('680364d1000477ec420b');

const DATABASE_ID = '6816dc7f00195dd533bf';
const COLLECTION_ID = '6816de0600052ed834e4'; 
const CODE_COLLECTION_ID = '682215d200201cb95f05'; 
const databases = new Appwrite.Databases(client);

let currentProject = null;
let activeEditor = null;
const editors = {
    html: null,
    css: null,
    js: null
};


let consoleVisible = false;
const consoleOutput = [];

const debouncedUpdatePreview = debounce(updatePreview, 300);


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setupConsole() {
    const consoleButton = document.createElement('button');
    consoleButton.id = 'consoleButton';
    consoleButton.className = 'console-button';
    consoleButton.innerHTML = '📋 Console';
    document.querySelector('.editor-tabs').appendChild(consoleButton);
    const consoleDivider = document.createElement('div');
    consoleDivider.className = 'console-divider';
    consoleDivider.style.display = 'none';

    const consolePanel = document.createElement('div');
    consolePanel.id = 'consolePanel';
    consolePanel.className = 'console-panel';
    consolePanel.innerHTML = `
        <div class="console-header">
            <span>Console Output</span>
            <button id="clearConsole">Clear</button>
            <button id="closeConsole">×</button>
        </div>
        <div class="console-content"></div>
    `;
    document.body.appendChild(consoleDivider);
    document.body.appendChild(consolePanel);

    consoleButton.addEventListener('click', () => {
        consoleVisible = !consoleVisible;
        consolePanel.style.display = consoleVisible ? 'block' : 'none';
        consoleDivider.style.display = consoleVisible ? 'block' : 'none';
        if (consoleVisible) {





            
            const panelHeight = consolePanel.offsetHeight;
            consoleDivider.style.top = (window.innerHeight - panelHeight - consoleDivider.offsetHeight / 2) + 'px';
            updateConsoleDisplay();
        }
    });


    document.getElementById('clearConsole').addEventListener('click', () => {
        consoleOutput.length = 0;
        updateConsoleDisplay();
    });

    document.getElementById('closeConsole').addEventListener('click', () => {
        consoleVisible = false;
        consolePanel.style.display = 'none';
        consoleDivider.style.display = 'none';
    });

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    function onMouseMove(e) {
        if (!isDragging) return;
        const mouseY = e.touches ? e.touches[0].clientY : e.clientY;
        let newHeight = window.innerHeight - mouseY;
        newHeight = Math.max(80, Math.min(window.innerHeight * 0.6, newHeight));
        consolePanel.style.height = newHeight + 'px';
        consoleDivider.style.top = (window.innerHeight - newHeight - consoleDivider.offsetHeight / 2) + 'px';
    }

    function onMouseUp() {
        if (isDragging) {
            isDragging = false;
            consoleDivider.classList.remove('dragging');
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
        }
    }

    consoleDivider.addEventListener('mousedown', (e) => {
        isDragging = true;
        consoleDivider.classList.add('dragging');
        document.body.style.cursor = 'ns-resize';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    });
    consoleDivider.addEventListener('touchstart', (e) => {
        isDragging = true;
        consoleDivider.classList.add('dragging');
        document.body.style.cursor = 'ns-resize';
        document.addEventListener('touchmove', onMouseMove);
        document.addEventListener('touchend', onMouseUp);
        e.preventDefault();
    }, { passive: false });


    window.addEventListener('resize', () => {
        if (consoleVisible) {
            const panelHeight = consolePanel.offsetHeight;
            consoleDivider.style.top = (window.innerHeight - panelHeight - consoleDivider.offsetHeight / 2) + 'px';
        }
    });
}

function updateConsoleDisplay() {
    const consoleContent = document.querySelector('.console-content');
    consoleContent.innerHTML = consoleOutput.map(log => {
        const type = log.type || 'log';
        const message = log.message;
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        return `<div class="console-line ${type}">
            <span class="console-timestamp">[${timestamp}]</span>
            <span class="console-message">${message}</span>
        </div>`;
    }).join('');
    consoleContent.scrollTop = consoleContent.scrollHeight;
}

function logToConsole(message, type = 'log') {
    consoleOutput.push({
        message: String(message),
        type,
        timestamp: new Date()
    });
    if (consoleVisible) {
        updateConsoleDisplay();
    }
}


function updatePreview() {
    const preview = document.getElementById('previewFrame');
    if (!preview) return;

    const html = editors.html ? editors.html.getValue() : '';
    const css = editors.css ? editors.css.getValue() : '';
    const js = editors.js ? editors.js.getValue() : '';
    

    const isFullHTML = html.toLowerCase().includes('<!doctype') || html.toLowerCase().includes('<html');
    
    const consoleOverrideScript = `
        <script type="text/javascript">
        if (!window._consoleOverridden) {
            window._consoleOverridden = true;
            window._originalConsole = {
                log: console.log,
                error: console.error,
                warn: console.warn,
                info: console.info
            };
            function sendToParent(type, ...args) {
                window.parent.postMessage({
                    type: 'console',
                    method: type,
                    args: args.map(arg => {
                        if (typeof arg === 'object') {
                            try {
                                return JSON.stringify(arg);
                            } catch (e) {
                                return String(arg);
                            }
                        }
                        return String(arg);
                    })
                }, '*');
            }
            console.log = (...args) => {
                window._originalConsole.log.apply(console, args);
                sendToParent('log', ...args);
            };
            console.error = (...args) => {
                window._originalConsole.error.apply(console, args);
                sendToParent('error', ...args);
            };
            console.warn = (...args) => {
                window._originalConsole.warn.apply(console, args);
                sendToParent('warn', ...args);
            };
            console.info = (...args) => {
                window._originalConsole.info.apply(console, args);
                sendToParent('info', ...args);
            };
        }
        </script>
    `;
    
    const userScript = `<script type="text/javascript">\ntry {\n${js}\n} catch(e) {console.error('Preview JS Error:', e);}\n</script>`;
    
    const content = isFullHTML ? html : `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style type="text/css">
                    ${css}
                </style>
            </head>
            <body>
                ${html}
                ${consoleOverrideScript}
                ${userScript}
            </body>
        </html>
    `;
    
    try {
        const previewDocument = preview.contentDocument || preview.contentWindow.document;
        previewDocument.open();
        previewDocument.write(content);
        previewDocument.close();


        const handleError = (e) => {
            console.error('Resource loading error:', e.target.src || e.target.href);
        };
        
        previewDocument.addEventListener('error', handleError, true);
    } catch (error) {
        console.error('Preview update error:', error);
    }


    const consolePanel = document.getElementById('consolePanel');
    const consoleDivider = document.querySelector('.console-divider');
    if (consolePanel && consoleDivider) {
        if (consolePanel.style.display === 'block') {
            consoleDivider.style.display = 'block';
        } else {
            consoleDivider.style.display = 'none';
        }
    }
}


window.addEventListener('message', (event) => {
    if (event.data.type === 'console') {
        const message = event.data.args.join(' ');
        logToConsole(message, event.data.method);
    }
});

function setupPreviewDivider() {
    const divider = document.querySelector('.divider');
    const editorContainer = document.querySelector('.editor-container');
    let isDragging = false;
    let startX = 0;
    let startWidth = 0;


    const savedWidth = localStorage.getItem('editorWidth');



    if (savedWidth) {
        editorContainer.style.width = savedWidth;
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        const clientX = e.clientX;
        const deltaX = clientX - startX;
        const totalWidth = document.body.offsetWidth;
        let newWidth = startWidth + deltaX;
        
        




        const minWidth = Math.max(300, totalWidth * 0.2);
        const maxWidth = totalWidth * 0.8;
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        editorContainer.style.width = newWidth + 'px';
        localStorage.setItem('editorWidth', newWidth + 'px');
        
        if (window.editors) {
            Object.values(window.editors).forEach(editor => {
                if (editor) editor.refresh();
            });
        }
    }

    function onPointerUp(e) {
        if (isDragging) {
            isDragging = false;
            divider.classList.remove('dragging');
            document.body.style.cursor = '';
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            if (divider.releasePointerCapture && e.pointerId) {
                divider.releasePointerCapture(e.pointerId);
            }
        }
    }

    divider.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startWidth = editorContainer.offsetWidth;
        divider.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        if (divider.setPointerCapture) {
            divider.setPointerCapture(e.pointerId);
        }
        e.preventDefault();
    });




    window.addEventListener('resize', () => {
        const totalWidth = document.body.offsetWidth;
        const minWidth = Math.max(300, totalWidth * 0.2);
        const maxWidth = totalWidth * 0.8;
        let currentWidth = editorContainer.offsetWidth;
        if (currentWidth < minWidth) {
            editorContainer.style.width = minWidth + 'px';
        } else if (currentWidth > maxWidth) {
            editorContainer.style.width = maxWidth + 'px';
        }

        if (window.editors) {
            Object.values(window.editors).forEach(editor => {
                if (editor) editor.refresh();
            });
        }
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    if (!projectId) {
        alert('Invalid project URL');
        window.location.href = 'Home.html';
        return;
    }

    await initializeEditors();
    setupTabHandlers();
    setupSaveHandler();
    setupPreviewDivider();
    setupConsole();

    try {

        currentProject = await databases.getDocument(DATABASE_ID, COLLECTION_ID, projectId);
        document.getElementById('projectTitle').textContent = currentProject.title || '(Untitled Project)';

        let codeDoc;
        try {
            codeDoc = await databases.getDocument(DATABASE_ID, CODE_COLLECTION_ID, projectId);
        } catch (e) {
     



            codeDoc = { html_code: '', css_code: '', js_code: '' };
        }
        editors.html.setValue(codeDoc.html_code || '');
        editors.css.setValue(codeDoc.css_code || '');
        editors.js.setValue(codeDoc.js_code || '');
        debouncedUpdatePreview();
    } catch (error) {
        console.error('Error loading project:', error);
        alert('Failed to load project');
    }
});

async function initializeEditors() {
    const editorTextarea = document.getElementById('editor');
    
    editors.html = CodeMirror.fromTextArea(editorTextarea, {
        lineNumbers: true,
        mode: 'htmlmixed',
        theme: 'default',
        autoCloseTags: true
    });
    
    editors.css = CodeMirror.fromTextArea(editorTextarea, {
        lineNumbers: true,
        mode: 'css', 
        theme: 'default'
    });
    
    editors.js = CodeMirror.fromTextArea(editorTextarea, {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'default'
    });


    switchEditor('html');
    

    Object.values(editors).forEach(editor => {
        if (editor) {
            editor.on('change', debouncedUpdatePreview);
        }
    });
}

function switchEditor(language) {
    if (!editors[language]) return;

    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.language === language) {
            tab.classList.add('active');
        }
    });

    Object.values(editors).forEach(editor => {
        if (editor && editor.getWrapperElement()) {
            editor.getWrapperElement().style.display = 'none';
        }
    });
    
    if (editors[language] && editors[language].getWrapperElement()) {
        editors[language].getWrapperElement().style.display = 'block';
        editors[language].refresh();
    }
}

function setupTabHandlers() {
    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const language = tab.dataset.language;
            if (language) {
                switchEditor(language);
            }
        });
    });
}

function setupSaveHandler() {
    const saveButton = document.getElementById('saveButton');
    if (!saveButton) return;

    saveButton.addEventListener('click', async () => {
        if (!currentProject || !currentProject.$id) {
            alert('No project loaded');
            return;
        }
        const codeData = {
            html_code: editors.html ? editors.html.getValue() : '',
            css_code: editors.css ? editors.css.getValue() : '',
            js_code: editors.js ? editors.js.getValue() : ''
        };
        try {

            await databases.updateDocument(
                DATABASE_ID,
                CODE_COLLECTION_ID,
                currentProject.$id,
                codeData
            );
            alert('Project code saved successfully!');
        } catch (error) {
            if (error && error.message && error.message.includes('could not be found')) {
                try {
                    await databases.createDocument(
                        DATABASE_ID,
                        CODE_COLLECTION_ID,
                        currentProject.$id,
                        codeData
                    );
                    alert('Project code created and saved successfully!');
                } catch (createErr) {
                    console.error('Error creating project code:', createErr);
                    alert('Failed to create project code');
                }
            } else {
                console.error('Error saving project code:', error);
                alert('Failed to save project code');
            }
        }
    });
}