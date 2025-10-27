'use strict';
var obsidian = require('obsidian');

class NoteBlockPlugin extends obsidian.Plugin {
    async onload() {
        console.log('Загружен Note Block Plugin с поддержкой {note}, {warning}, {tip}, {admonition}');
        
        // Сохраняем ссылку на app для использования в обработчиках
        this.appInstance = this.app;
        
        // Обработчик через MarkdownPostProcessor для всех типов блоков
        this.registerMarkdownPostProcessor((element, context) => {
            this.processAdmonitionBlocks(element, context);
        });
    }
    
    processAdmonitionBlocks(element, context) {
        const codeBlocks = element.querySelectorAll('pre code');
        
        codeBlocks.forEach((codeBlock) => {
            const preElement = codeBlock.parentElement;
            const languageMatch = codeBlock.className.match(/language-(\S+)/);
            
            if (languageMatch) {
                const blockType = languageMatch[1];
                
                // Проверяем все поддерживаемые типы блоков
                if (blockType === '{note}' || blockType === '{warning}' || 
                    blockType === '{tip}' || blockType === '{admonition}') {
                    console.log(`🎯 Найден блок ${blockType}`);
                    this.convertToAdmonitionBlock(codeBlock, preElement, blockType, context);
                }
            }
        });
    }
    
    convertToAdmonitionBlock(codeBlock, preElement, blockType, context) {
        const content = codeBlock.textContent || '';
        const originalMarkdown = `\`\`\`${blockType}\n${content}\n\`\`\``;
        
        // Создаем основной контейнер
        const container = document.createElement('div');
        container.addClass('admonition-block');
        container.addClass(`admonition-${blockType.replace(/[{}]/g, '')}`);
        
        // Определяем заголовок и иконку в зависимости от типа
        let headerText = '';
        let icon = '';
        
        switch(blockType) {
            case '{note}':
                headerText = 'Примечание';
                icon = '📝';
                break;
            case '{warning}':
                headerText = 'Предупреждение';
                icon = '⚠️';
                break;
            case '{tip}':
                headerText = 'Совет';
                icon = '💡';
                break;
            case '{admonition}':
                headerText = 'Внимание';
                icon = '📌';
                break;
        }
        
        // Создаем заголовок
        const headerDiv = document.createElement('div');
        headerDiv.addClass('admonition-header');
        
        // Добавляем иконку и текст в заголовок
        const headerContent = document.createElement('span');
        headerContent.setText(`${icon} ${headerText}`);
        headerDiv.appendChild(headerContent);
        
        // Создаем кнопку копирования
        const copyButton = document.createElement('button');
        copyButton.addClass('admonition-copy-button');
        copyButton.setAttribute('title', 'Копировать как Markdown');
        copyButton.innerHTML = '📋';
        
        // Обработчик копирования
        copyButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await navigator.clipboard.writeText(originalMarkdown);
                
                // Визуальная обратная связь
                const originalHTML = copyButton.innerHTML;
                copyButton.innerHTML = '✅';
                copyButton.classList.add('copied');
                
                setTimeout(() => {
                    copyButton.innerHTML = originalHTML;
                    copyButton.classList.remove('copied');
                }, 2000);
                
            } catch (err) {
                console.error('Ошибка копирования:', err);
                copyButton.innerHTML = '❌';
                setTimeout(() => {
                    copyButton.innerHTML = '📋';
                }, 2000);
            }
        });
        
        headerDiv.appendChild(copyButton);
        
        // Создаем контент с обработкой Markdown
        const contentDiv = document.createElement('div');
        contentDiv.addClass('admonition-content');
        
        // Используем правильный метод для рендеринга Markdown
        // Способ 1: Используем MarkdownRenderChild
        try {
            const MarkdownRenderChild = obsidian.MarkdownRenderChild;
            const child = new MarkdownRenderChild(contentDiv);
            child.containerEl = contentDiv;
            
            // Рендерим Markdown контент
            obsidian.MarkdownRenderer.render(
                this.appInstance,
                content,
                contentDiv,
                context.sourcePath,
                child
            );
        } catch (error) {
            console.error('Ошибка рендеринга Markdown:', error);
            // Если рендеринг не работает, просто вставляем текст
            contentDiv.setText(content);
        }
        
        // Собираем структуру
        container.appendChild(headerDiv);
        container.appendChild(contentDiv);
        
        // Заменяем исходный блок кода на наш блок
        if (preElement) {
            preElement.replaceWith(container);
        }
    }
}

module.exports = NoteBlockPlugin;