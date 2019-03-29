const pdfjsLib = require("pdfjs-dist")
pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.min")

export const getPDF = (url, onProgress) => {
    return new Promise((resolve, reject) => {
        const loadingTask = pdfjsLib.getDocument(url)
        loadingTask.onProgress = onProgress
        loadingTask.promise.then(resolve, reject)
    })
}

