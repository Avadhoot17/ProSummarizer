document.addEventListener('DOMContentLoaded', () => {
    const inputTextElem = document.getElementById('inputText');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const summaryOutputElem = document.getElementById('summaryOutput');
    const originalWordCountElem = document.getElementById('originalWordCount');
    const summaryWordCountElem = document.getElementById('summaryWordCount');
    const copySummaryBtn = document.getElementById('copySummaryBtn');

    // Update word count for the input text area
    inputTextElem.addEventListener('input', () => {
        const text = inputTextElem.value;
        originalWordCountElem.textContent = countWords(text);
    });

    // Handle Summarize button click
    summarizeBtn.addEventListener('click', async () => {
        const textToSummarize = inputTextElem.value.trim();
        if (!textToSummarize) {
            alert('Please enter some text to summarize.');
            return;
        }

        // Show loading state
        summarizeBtn.disabled = true;
        summarizeBtn.textContent = 'Summarizing...';
        summaryOutputElem.innerHTML = '<div class="summary-output-placeholder">Processing your text...</div>';
        summaryWordCountElem.textContent = '0';
        copySummaryBtn.style.display = 'none';


        try {
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: textToSummarize }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const summary = data.summary;
            
            summaryOutputElem.textContent = summary;
            summaryWordCountElem.textContent = countWords(summary);
            copySummaryBtn.style.display = 'inline-block';

        } catch (error) {
            console.error('Error summarizing text:', error.message);
            summaryOutputElem.innerHTML = `<div class="summary-output-placeholder" style="color: red;">Error: ${error.message}</div>`;
            // alert(`An error occurred: ${error.message}`); // Alert can be annoying, console log is often enough
        } finally {
            // Restore button state
            summarizeBtn.disabled = false;
            summarizeBtn.textContent = 'Summarize';
        }
    });

    // Handle Copy Summary button click
    copySummaryBtn.addEventListener('click', () => {
        const summaryText = summaryOutputElem.textContent;
        if (navigator.clipboard && summaryText) {
            navigator.clipboard.writeText(summaryText)
                .then(() => {
                    // Optional: Show a "Copied!" notification (snackbar)
                    showSnackbar('Summary copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy summary: ', err);
                    alert('Failed to copy summary. Please try again.');
                });
        }
    });

    // Utility function to count words
    function countWords(text) {
        if (!text.trim()) return 0;
        return text.trim().split(/\s+/).length;
    }

    // Mock API call function is no longer needed as we call the backend.
    // async function mockSummarizeAPI(text) { ... }

    // Function to show a snackbar notification
    function showSnackbar(message) {
        let snackbar = document.getElementById('snackbar');
        if (!snackbar) {
            snackbar = document.createElement('div');
            snackbar.id = 'snackbar';
            document.body.appendChild(snackbar);
        }
        snackbar.textContent = message;
        snackbar.className = 'show'; // Add 'show' class to display it
        setTimeout(() => {
            snackbar.className = snackbar.className.replace('show', '');
        }, 3000); // Hide after 3 seconds
    }

    // Add CSS for the snackbar dynamically (or add to style.css)
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
        #snackbar {
            visibility: hidden;
            min-width: 250px;
            margin-left: -125px;
            background-color: #333;
            color: #fff;
            text-align: center;
            border-radius: 2px;
            padding: 16px;
            position: fixed;
            z-index: 1;
            left: 50%;
            bottom: 30px;
            font-size: 17px;
        }
        #snackbar.show {
            visibility: visible;
            -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
            animation: fadein 0.5s, fadeout 0.5s 2.5s;
        }
        @-webkit-keyframes fadein {
            from {bottom: 0; opacity: 0;}
            to {bottom: 30px; opacity: 1;}
        }
        @keyframes fadein {
            from {bottom: 0; opacity: 0;}
            to {bottom: 30px; opacity: 1;}
        }
        @-webkit-keyframes fadeout {
            from {bottom: 30px; opacity: 1;}
            to {bottom: 0; opacity: 0;}
        }
        @keyframes fadeout {
            from {bottom: 30px; opacity: 1;}
            to {bottom: 0; opacity: 0;}
        }
    `;
    document.head.appendChild(styleSheet);
});