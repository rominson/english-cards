const cardContainer = document.getElementById('card-container');
const card = document.querySelector('.card');
const contentSpan = document.querySelector('.content');
const translationSpan = document.querySelector('.translation');
const playBtn = document.querySelector('.play-btn');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const deleteBtn = document.querySelector('.delete-btn');
const shuffleBtn = document.querySelector('.shuffle-btn');

let currentIndex = 0;
let cardsData = [];

// 翻译API
async function translateText(text) {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`);
    const data = await response.json();
    return data.responseData.translatedText;
}

const newWordInput = document.getElementById('new-word');
const submitBtn = document.getElementById('submit-btn');

// 存储可用的语音列表
let availableVoices = [];

// 初始化语音列表和语音选择下拉菜单
function initVoices() {
    availableVoices = window.speechSynthesis.getVoices();
    updateVoiceList();
}

// 更新语音选择下拉菜单
function updateVoiceList() {
    const voiceSelect = document.getElementById('voice-select');
    
    // 清空现有选项（保留默认选项）
    while (voiceSelect.options.length > 1) {
        voiceSelect.options.remove(1);
    }
    
    // 添加英语语音选项
    const englishVoices = availableVoices.filter(voice => voice.lang.includes('en'));
    englishVoices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = availableVoices.indexOf(voice);
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
    
    console.log(`加载了 ${englishVoices.length} 个英语语音`);
}

// 如果浏览器支持语音合成，初始化语音列表
if ('speechSynthesis' in window) {
    // Chrome需要等待voiceschanged事件
    speechSynthesis.onvoiceschanged = initVoices;
    // 立即尝试初始化一次，适用于Firefox等浏览器
    initVoices();
    
    // 设置语音参数滑块的事件监听器
    const rateSlider = document.getElementById('rate-slider');
    const rateValue = document.getElementById('rate-value');
    rateSlider.addEventListener('input', () => {
        rateValue.textContent = rateSlider.value;
    });
    
    const pitchSlider = document.getElementById('pitch-slider');
    const pitchValue = document.getElementById('pitch-value');
    pitchSlider.addEventListener('input', () => {
        pitchValue.textContent = pitchSlider.value;
    });
}

// 使用Web Speech API播放文本
function playText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        
        // 如果语音列表为空，重新获取
        if (availableVoices.length === 0) {
            availableVoices = window.speechSynthesis.getVoices();
        }
        
        // 获取用户选择的语音
        const selectedVoiceIndex = document.getElementById('voice-select').value;
        if (selectedVoiceIndex !== 'default' && availableVoices[selectedVoiceIndex]) {
            utterance.voice = availableVoices[selectedVoiceIndex];
            console.log('使用选择的语音:', utterance.voice.name);
        } else {
            // 如果没有选择或选择的是默认，尝试找到更自然的英语语音
            let naturalVoice = availableVoices.find(voice => 
                voice.lang.includes('en') && 
                (voice.name.includes('Google') || voice.name.includes('Natural') || 
                 voice.name.includes('Samantha') || voice.name.includes('Alex') || 
                 voice.name.includes('Daniel'))
            );
            
            // 如果找到了更自然的语音，使用它
            if (naturalVoice) {
                utterance.voice = naturalVoice;
                console.log('使用自动选择的语音:', naturalVoice.name);
            } else {
                console.log('未找到自然语音，使用默认语音');
            }
        }
        
        // 获取用户设置的语速
        const rate = parseFloat(document.getElementById('rate-slider').value);
        utterance.rate = rate;
        
        // 获取用户设置的音调
        const pitch = parseFloat(document.getElementById('pitch-slider').value);
        utterance.pitch = pitch;
        
        // 保持正常音量
        utterance.volume = 1.0;
        
        speechSynthesis.speak(utterance);
    } else {
        alert('您的浏览器不支持语音合成功能');
    }
}

// 提交按钮事件监听
submitBtn.addEventListener('click', async () => {
    const newWord = newWordInput.value.trim();
    if (newWord) {
        addNewCard(newWord);
        newWordInput.value = '';
    }
});

// 从localStorage加载卡片数据
function loadCardsFromStorage() {
    const savedCards = localStorage.getItem('englishCards');
    if (savedCards) {
        try {
            return JSON.parse(savedCards);
        } catch (error) {
            console.error('加载保存的卡片数据失败:', error);
            return null;
        }
    }
    return null;
}

// 保存卡片数据到localStorage
function saveCardsToStorage() {
    try {
        localStorage.setItem('englishCards', JSON.stringify(cardsData));
        console.log('卡片数据已保存');
    } catch (error) {
        console.error('保存卡片数据失败:', error);
        showErrorMessage('保存数据失败，您的数据可能在关闭浏览器后丢失');
    }
}

// 初始化卡片数据
function initCards() {
    const savedCards = loadCardsFromStorage();
    if (savedCards && savedCards.length > 0) {
        cardsData = savedCards;
        console.log('已从本地存储加载', cardsData.length, '张卡片');
    } else {
        cardsData = [
            { word: 'Hello', translation: '你好' },
            { word: 'Goodbye', translation: '再见' },
            { word: 'Thank you', translation: '谢谢' },
            { word: 'I love learning English', translation: '我喜欢学习英语' }
        ];
        console.log('使用默认卡片数据');
    }
    updateCard();
}

// 添加新卡片
async function addNewCard(word) {
    const translation = await translateText(word);
    cardsData.push({ word: word, translation: translation });
    currentIndex = cardsData.length - 1; // 切换到新添加的卡片
    updateCard();
    // 保存到本地存储
    saveCardsToStorage();
}

// 更新卡片内容
function updateCard() {
    const currentCard = cardsData[currentIndex];
    contentSpan.textContent = currentCard.word;
    
    // 直接设置翻译文本
    translationSpan.textContent = currentCard.translation;
    
    card.classList.remove('flipped'); // 确保新卡片显示正面
    
    // 检查翻译是否为空，如果为空则添加empty-translation类
    const backSide = document.querySelector('.back');
    if (!currentCard.translation || currentCard.translation.trim() === '') {
        backSide.classList.add('empty-translation');
    } else {
        backSide.classList.remove('empty-translation');
    }
    
    // 确保编辑按钮在所有浏览器环境中都有一定的可见度
    const editBtn = document.querySelector('.edit-btn');
    if (editBtn) {
        // 在移动设备上保持一定的可见度
        if (window.innerWidth <= 768) {
            editBtn.style.opacity = '0.7';
        } else {
            // 确保在非移动设备上编辑按钮也有一定的可见度
            editBtn.style.opacity = '0.5';
        }
    }
}

// 卡片点击事件
card.addEventListener('click', () => {
    card.classList.toggle('flipped');
});

// 获取编辑按钮
const editBtn = document.querySelector('.edit-btn');

// 编辑按钮点击事件
editBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发卡片翻转
    
    const currentCard = cardsData[currentIndex];
    const currentTranslation = currentCard.translation || '';
    
    // 创建一个输入框来编辑翻译
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTranslation;
    input.className = 'translation-edit';
    input.style.fontSize = '28px';
    input.style.width = '80%';
    input.style.textAlign = 'center';
    input.style.border = '2px solid #28a745';
    input.style.borderRadius = '5px';
    input.style.padding = '5px';
    
    // 替换翻译文本为输入框
    translationSpan.style.display = 'none';
    translationSpan.parentNode.insertBefore(input, translationSpan);
    input.focus();
    
    // 处理输入框失去焦点事件
    input.addEventListener('blur', saveTranslation);
    
    // 处理回车键事件
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveTranslation();
        }
    });
    
    // 保存翻译的函数
    function saveTranslation() {
        const newTranslation = input.value.trim();
        
        // 更新卡片数据
        cardsData[currentIndex].translation = newTranslation;
        
        // 更新显示
        // 直接设置翻译文本
        translationSpan.textContent = newTranslation;
        
        translationSpan.style.display = '';
        
        // 移除输入框
        if (input.parentNode) {
            input.parentNode.removeChild(input);
        }
        
        // 检查翻译是否为空，更新empty-translation类
        const backSide = document.querySelector('.back');
        if (!newTranslation) {
            backSide.classList.add('empty-translation');
        } else {
            backSide.classList.remove('empty-translation');
        }
        
        // 保存到本地存储
        saveCardsToStorage();
        
        // 显示保存成功提示
        const infoToast = document.createElement('div');
        infoToast.className = 'info-toast';
        infoToast.textContent = '翻译已更新';
        document.body.appendChild(infoToast);
        
        // 3秒后自动移除提示
        setTimeout(() => {
            infoToast.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(infoToast)) {
                    document.body.removeChild(infoToast);
                }
            }, 500);
        }, 3000);
    }
});

// 播放按钮点击事件
playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playText(cardsData[currentIndex].word);
});

// 上一张卡片
prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + cardsData.length) % cardsData.length;
    updateCard();
});

// 下一张卡片
nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % cardsData.length;
    updateCard();
});

// 删除当前卡片
deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (cardsData.length <= 1) {
        alert('至少需要保留一张卡片');
        return;
    }
    
    // 从数组中删除当前卡片
    cardsData.splice(currentIndex, 1);
    
    // 调整当前索引
    if (currentIndex >= cardsData.length) {
        currentIndex = cardsData.length - 1;
    }
    
    // 更新卡片显示
    updateCard();
    
    // 保存到本地存储
    saveCardsToStorage();
});

// 语音识别相关变量和功能
let recognition = null;
const voiceInputBtn = document.getElementById('voice-input-btn');

// 初始化语音识别
function initSpeechRecognition() {
    // 检查浏览器是否支持语音识别
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        // 创建语音识别对象
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        // 设置语音识别参数
        recognition.lang = 'en-US'; // 设置识别英语
        recognition.continuous = false; // 不连续识别
        recognition.interimResults = false; // 只返回最终结果
        
        // 语音识别结果事件
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('识别结果:', transcript);
            newWordInput.value = transcript;
        };
        
        // 语音识别结束事件
        recognition.onend = () => {
            voiceInputBtn.classList.remove('listening');
            console.log('语音识别已结束');
        };
        
        // 语音识别错误事件
        recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            voiceInputBtn.classList.remove('listening');
            
            // 显示错误提示
            let errorMessage = '';
            switch(event.error) {
                case 'not-allowed':
                case 'permission-denied':
                    errorMessage = '麦克风访问被拒绝，请在浏览器设置中允许访问麦克风';
                    break;
                case 'no-speech':
                    errorMessage = '没有检测到语音，请再试一次';
                    break;
                case 'audio-capture':
                    errorMessage = '无法捕获音频，请检查麦克风是否正常工作';
                    break;
                case 'network':
                    errorMessage = '网络错误，请检查您的网络连接';
                    break;
                case 'aborted':
                    errorMessage = '语音识别被中止';
                    break;
                case 'language-not-supported':
                    errorMessage = '当前语言不受支持';
                    break;
                default:
                    errorMessage = '语音识别失败，请稍后再试';
            }
            
            // 显示错误提示
            const errorToast = document.createElement('div');
            errorToast.className = 'error-toast';
            errorToast.textContent = errorMessage;
            document.body.appendChild(errorToast);
            
            // 3秒后自动移除提示
            setTimeout(() => {
                errorToast.classList.add('fade-out');
                setTimeout(() => {
                    document.body.removeChild(errorToast);
                }, 500);
            }, 3000);
        };
        
        // 语音输入按钮点击事件
        voiceInputBtn.addEventListener('click', toggleSpeechRecognition);
    } else {
        console.error('您的浏览器不支持语音识别功能');
        voiceInputBtn.style.display = 'none'; // 如果不支持，隐藏按钮
        
        // 显示浏览器不支持的提示
        const errorToast = document.createElement('div');
        errorToast.className = 'error-toast';
        errorToast.textContent = '您的浏览器不支持语音识别功能，请使用Chrome、Edge或Safari等现代浏览器';
        document.body.appendChild(errorToast);
        
        // 5秒后自动移除提示
        setTimeout(() => {
            errorToast.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(errorToast);
            }, 500);
        }, 5000);
    }
}

// 切换语音识别状态
function toggleSpeechRecognition() {
    if (recognition) {
        if (voiceInputBtn.classList.contains('listening')) {
            // 如果正在监听，停止识别
            recognition.stop();
            voiceInputBtn.classList.remove('listening');
        } else {
            // 检查麦克风权限
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // 先请求麦克风权限
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(() => {
                        // 权限获取成功，开始识别
                        try {
                            recognition.start();
                            voiceInputBtn.classList.add('listening');
                            console.log('开始语音识别...');
                            
                            // 显示提示
                            const infoToast = document.createElement('div');
                            infoToast.className = 'info-toast';
                            infoToast.textContent = '请说出英文单词或句子...';
                            document.body.appendChild(infoToast);
                            
                            // 3秒后自动移除提示
                            setTimeout(() => {
                                infoToast.classList.add('fade-out');
                                setTimeout(() => {
                                    if (document.body.contains(infoToast)) {
                                        document.body.removeChild(infoToast);
                                    }
                                }, 500);
                            }, 3000);
                        } catch (error) {
                            console.error('启动语音识别失败:', error);
                            showErrorMessage('启动语音识别失败，请刷新页面后重试');
                        }
                    })
                    .catch(error => {
                        console.error('麦克风访问被拒绝:', error);
                        showErrorMessage('麦克风访问被拒绝，请在浏览器设置中允许访问麦克风');
                    });
            } else {
                console.error('浏览器不支持getUserMedia API');
                showErrorMessage('您的浏览器不支持麦克风访问，请使用Chrome、Edge或Safari等现代浏览器');
            }
        }
    }
}

// 显示错误消息
function showErrorMessage(message) {
    const errorToast = document.createElement('div');
    errorToast.className = 'error-toast';
    errorToast.textContent = message;
    document.body.appendChild(errorToast);
    
    // 3秒后自动移除提示
    setTimeout(() => {
        errorToast.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(errorToast)) {
                document.body.removeChild(errorToast);
            }
        }, 500);
    }, 3000);
}

// 打乱卡片顺序
function shuffleCards() {
    if (cardsData.length <= 1) {
        showErrorMessage('至少需要两张卡片才能打乱顺序');
        return;
    }
    
    // 使用Fisher-Yates洗牌算法
    for (let i = cardsData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardsData[i], cardsData[j]] = [cardsData[j], cardsData[i]];
    }
    
    // 重置当前索引并更新卡片
    currentIndex = 0;
    updateCard();
    
    // 显示提示信息
    const infoToast = document.createElement('div');
    infoToast.className = 'info-toast';
    infoToast.textContent = '卡片顺序已打乱';
    document.body.appendChild(infoToast);
    
    // 3秒后自动移除提示
    setTimeout(() => {
        infoToast.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(infoToast)) {
                document.body.removeChild(infoToast);
            }
        }, 500);
    }, 3000);
    
    // 保存到本地存储
    saveCardsToStorage();
}

// 打乱按钮点击事件
shuffleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shuffleCards();
});

// 初始化
initCards();
initSpeechRecognition(); // 初始化语音识别功能