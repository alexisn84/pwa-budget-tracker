//variable to hold db
let db;

//connection to IndexDB db called 'budget_tracket' v1
const request = indexedDB.open('budget_tracker', 1);

//emit if db version changes
request.onupgradeneeded = function(event) {
    //save ref to db
    const db = event.target.result;

    //create object called new transactions set it autoincrement PK
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

//if successful
request.onsuccess = function (event) {
    //create object if db is succesfful
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
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access object to store
    const budgetObjectStore = transaction.object('new_transaction');

    //add record
    budgetObjectStore.add(record);
}

function uploadTransaction() {
    //open on db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access object
    const budgetObjectStore = transaction.ObjectStore('new_transaction');

    //get all records set to variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        //send data on IndexedDB to api server
        if (getAll.result.length > 0) {
            fetch('/api/transactions', {
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
                const transaction = db.transaction(['new_transaction'], 'readwrite');

                //access new transaction store
                const budgetObjectStore = transaction.ObjectStore('new_transaction');

                //clear all items
                budgetObjectStore.clear();

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