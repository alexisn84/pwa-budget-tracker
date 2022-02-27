//variable to hold db
let db;

//connection to IndexDB db called 'budget_tracket' v1
const request = indexedDB.open('budget_tracker', 1);


//emit if db version changes
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('transaction', { autoIncrement: true });
};

//if successful
request.onsuccess = function (event) {
    db = event.target.result;

    //check if online and upload transactions if so
    if(navigator.onLine){ 
        //upload tranactions
        uploadTransaction();
    }
};

//log error 
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

//function to execute if attempt to submit and no internet
function saveRecord(record) {
    //read write permission to new transaction
    const transaction = db.transaction(['transaction'], 'readwrite');

    //access object to store
    const transactionObjectStore = transaction.objectStore('transaction');

    //add record
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    const transaction = db.transaction(['transaction'], 'readwrite');

    //access object
    const transactionObjectStore = transaction.objectStore('transaction');

    //get all records set to variable
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open transaction
                const transaction = db.transaction(['transaction'], 'readwrite');

                //access new transaction store
                let transactionsObjectStore = transaction.objectStore('transaction');
                
                // clear all transactions in your store
                transactionsObjectStore.clear();

                alert('All saved transactions have been posted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
}

//listen for app back online
window.addEventListener('online', uploadTransaction);