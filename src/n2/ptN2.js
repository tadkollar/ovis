let sharedTransition = null;
let enterIndex = 0;
let exitIndex = 0;
let modelData = null;
let n2Diag = null;
let n2MouseFuncs = null;

function initializeOmN2() {
    // Compressed model data is generated and populated by n2_viewer.py
    modelData = ModelData.uncompressModel(compressedModel);
    delete compressedModel;
}

function initializeOvisN2() {
    // With OVis, model data is received from the server
    server.getDriverMetadata().then(data => {
        const mvd = data['model_viewer_data'];
        modelData = (typeof mvd === 'string') ? JSON.parse(mvd) : mvd;
        if (!modelData) throw ("No model data found!");
        n2Diag = new N2Diagram(modelData);
        n2MouseFuncs = n2Diag.getMouseFuncs();
        n2Diag.update(false);
    });
}