function extractAsuraScansInfo(titleTag) {
    if (titleTag) {
        try {
            console.log('Title tag:', titleTag)
            let novel_source = 'AsuraScans';
            titleTag = titleTag.replace('– Asura Scans', '').trim();

            let parts = titleTag.split(/ chapter | Chapter /i);
            let bookTitle = parts[0].trim();
            let chapter = parts[1].trim();

            console.log('Returning book info:', { bookTitle, chapter, novel_source })
            return { bookTitle, chapter, novel_source };
        } catch (error) {
            console.error('Error extracting book info:', error.message);
            return null;
        }
    }
    return null;
}

function extractLightNovelPubInfo(titleTag) {
    if (titleTag) {
        console.log('Title tag:', titleTag);
        let parts = titleTag.split(' | ');
        let bookTitleAndChapter = parts[0];
        let novel_source = 'Light Novel Pub';

        let chapterIndex = bookTitleAndChapter.lastIndexOf(' - ');
        let bookTitle = bookTitleAndChapter.substring(0, chapterIndex).trim();
        let chapter = bookTitleAndChapter.substring(chapterIndex + 3).trim();

        if (chapter.startsWith('Chapter ')) {
            chapter = chapter.replace('Chapter ', '');
            chapter = chapter.replace(':', ' -');
        }

        console.log('Returning book info:', { bookTitle, chapter, novel_source });
        return { bookTitle, chapter, novel_source };
    }
    return null;
}

function extractBookInfo(activeTab) {
    let hostname = new URL(activeTab.url).hostname;
    console.log('activeTab:', activeTab)

    if (hostname.includes('asuracomic.net')) {
        console.log('Extracting AsuraScans info');
        return extractAsuraScansInfo(activeTab.title);
    } else if (hostname.includes('lightnovelpub.vip')) {
        console.log('Extracting LightNovelPub info');
        return extractLightNovelPubInfo(activeTab.title);
    } else {
        console.log('Hostname not recognized for book info extraction');
        return null;
    }
}

function getUserEmailAndToken(callback) {
    chrome.storage.sync.get(['userEmail', 'userToken'], function(result) {
        if (result.userEmail && result.userToken) {
            console.log('User email and token:', result.userEmail, result.userToken);
            callback(result.userEmail, result.userToken);
        } else {
            console.error('User not logged in');
            callback(null, null);
        }
    });
}
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        let bookInfo = extractBookInfo(tab);
        if (bookInfo) {
            getUserEmailAndToken(function(userEmail, userToken) {
                if (userEmail && userToken) {
                    console.log('Sending book info:', bookInfo);

                    fetch('http://127.0.0.1:8000/centralized_API_backend/api/update-reading', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-User-Email': userEmail,
                            'Authorization': `Bearer ${userToken}`
                        },
                        body: JSON.stringify(bookInfo)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            console.log('Reading update successful');
                        } else {
                            console.error('Reading update failed: ' + data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error updating reading: ' + error.message);
                    });
                } else {
                    console.error('User email or token not found in storage');
                }
            });
        } else {
            console.error('Failed to extract book info');
        }
    }
});
