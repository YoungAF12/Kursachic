// Глобальные переменные для PDF
let pdfDoc = null;
let currentPage = 1;
let totalPages = 1;

// Устанавливаем worker для pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Загрузка файла
document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'txt') {
        loadTxtFile(file);
    } else if (fileExtension === 'pdf') {
        loadPdfFile(file);
    } else {
        alert('Пожалуйста, выберите файл в формате .txt или .pdf');
    }
});

// Загрузка текстового файла
function loadTxtFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        document.getElementById('book-content').innerHTML = '<pre>' + escapeHtml(content) + '</pre>';
        document.getElementById('book-content').style.display = 'block';
        document.getElementById('pdf-viewer').style.display = 'none';
        document.getElementById('pdf-controls').style.display = 'none';
        
        // Подсветка синтаксиса для кода в тексте
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    };
    reader.readAsText(file);
}

// Загрузка PDF файла
function loadPdfFile(file) {
    document.getElementById('book-content').style.display = 'none';
    document.getElementById('pdf-viewer').style.display = 'block';
    document.getElementById('pdf-controls').style.display = 'flex';
    
    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        
        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            
            // Обновляем элементы управления
            document.getElementById('page-slider').max = totalPages;
            updatePageInfo();
            
            // Загружаем первую страницу
            renderPage(currentPage);
        }).catch(function(error) {
            console.error('Ошибка при загрузке PDF:', error);
            alert('Ошибка при загрузке PDF файла');
        });
    };
    fileReader.readAsArrayBuffer(file);
}

// Рендеринг страницы PDF
function renderPage(pageNum) {
    if (!pdfDoc) return;
    
    pdfDoc.getPage(pageNum).then(function(page) {
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        page.render(renderContext).promise.then(function() {
            const pdfViewer = document.getElementById('pdf-viewer');
            pdfViewer.innerHTML = '';
            pdfViewer.appendChild(canvas);
            
            // Центрируем canvas
            canvas.style.margin = '0 auto';
            canvas.style.display = 'block';
            
            updatePageInfo();
        });
    });
}

// Навигация по PDF
function prevPage() {
    if (currentPage <= 1) return;
    currentPage--;
    renderPage(currentPage);
}

function nextPage() {
    if (currentPage >= totalPages) return;
    currentPage++;
    renderPage(currentPage);
}

function goToPage(pageNum) {
    const page = parseInt(pageNum);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderPage(currentPage);
    }
}

function updatePageInfo() {
    document.getElementById('page-info').textContent = `Страница: ${currentPage}/${totalPages}`;
    document.getElementById('page-slider').value = currentPage;
}

// Экранирование HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Тема
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
}

// Размер шрифта
let fontSize = 16;
function increaseFont() {
    fontSize += 1;
    document.getElementById('book-content').style.fontSize = fontSize + 'px';
}

function decreaseFont() {
    if (fontSize > 12) {
        fontSize -= 1;
        document.getElementById('book-content').style.fontSize = fontSize + 'px';
    }
}

// Добавление закладок
function addBookmark() {
    const bookmarksList = document.getElementById('bookmarks-list');
    const bookmark = document.createElement('li');
    bookmark.textContent = `Закладка ${bookmarksList.children.length + 1}`;
    bookmarksList.appendChild(bookmark);
}
