(function () {

    'use strict';

    var ENTER_KEY = 13;
    var newTodoDom = document.getElementById('new-todo');
    var syncDom = document.getElementById('sync-wrapper');

    // EDITING STARTS HERE (you dont need to edit anything above this line)

    var db = new PouchDB('medicine');
    var remoteCouch = 'https://d39f64bb-b370-4ca8-84d2-70ecf2bfe2bc-bluemix:9ce8a9c23ac8f6df065abc280681051f1072a1ae47bc34acc5dfc1055d83b178@d39f64bb-b370-4ca8-84d2-70ecf2bfe2bc-bluemix.cloudant.com/medicine';
    var quality = decodeURI(window.location.search.split("quality=")[1]);
    // var taste = decodeURI(window.location.search.split("taste=")[1]);

    db.changes({
        since: 'now',
        live: true
    }).on('change', showTodos);


    // We have to create a new todo document and enter it in the database
    function addTodo(text) {
        var todo = {
            _id: new Date().toISOString(),
            title: text,
            completed: false
        };
        db.put(todo, function callback(err, result) {
            if (!err) {
                console.log('Successfully posted a todo!');
            }
        });
    }

    // Show the current list of todos by reading them from the database
    function showTodos() {
        db.allDocs({include_docs: true}, function (err, doc) {
            redrawTodosUI(doc.rows);
            console.log(doc.rows);
        });
    }

    function checkboxChanged(todo, event) {
        todo.completed = event.target.checked;
        db.put(todo);
    }

    // User pressed the delete button for a todo, delete it
    function deleteButtonPressed(todo) {
        db.remove(todo);
    }

    // The input box when editing a todo has blurred, we should save
    // the new title or delete the todo if the title is empty
    function todoBlurred(todo, event) {
        var trimmedText = event.target.value.trim();
        if (!trimmedText) {
            db.remove(todo);
        } else {
            todo.title = trimmedText;
            db.put(todo);
        }
    }

    // Initialise a sync with the remote server
    function sync() {
        syncDom.setAttribute('data-sync-state', 'syncing');
        var opts = {live: true};
        db.replicate.to(remoteCouch, opts, syncError);
        db.replicate.from(remoteCouch, opts, syncError);
    }

    // EDITING STARTS HERE (you dont need to edit anything below this line)

    // There was some form or error syncing
    function syncError() {
        syncDom.setAttribute('data-sync-state', 'error');
    }

    // User has double clicked a todo, display an input so they can edit the title
    function todoDblClicked(todo) {
        var div = document.getElementById('li_' + todo._id);
        var inputEditTodo = document.getElementById('input_' + todo._id);
        div.className = 'editing';
        inputEditTodo.focus();
    }

    // If they press enter while editing an entry, blur it to trigger save
    // (or delete)
    function todoKeyPressed(todo, event) {
        if (event.keyCode === ENTER_KEY) {
            var inputEditTodo = document.getElementById('input_' + todo._id);
            inputEditTodo.blur();
        }
    }

    // Given an object representing a todo, this will create a list item
    // to display it.
    function createTodoListItem(todo) {
        var p = document.createElement('p');
        p.className = 'mui-ellipsis';
        p.appendChild(document.createTextNode(todo.pinyin));

        var divDisplay = document.createElement('div');
        divDisplay.className = 'mui-media-body';
        divDisplay.appendChild(document.createTextNode(todo.name));
        divDisplay.appendChild(p);

        var img = document.createElement('img');
        img.className = 'mui-media-object mui-pull-left';
        img.style = 'width:80px';
        img.src = todo.picture;

        var a = document.createElement('a');
        a.className = 'mui-navigate-right';
        a.href = 'medicine.html?id=' + todo._id;
        a.appendChild(img);
        a.appendChild(divDisplay);

        var li = document.createElement('li');
        li.className = 'mui-table-view-cell mui-media';
        li.id = 'li_' + todo._id;
        li.appendChild(a);

        return li;
    }

    function redrawTodosUI(todos,classify) {
        // var ul = document.getElementById('todo-list');
        // ul.innerHTML = '';
        // todos.forEach(function (todo) {
        //   ul.appendChild(createTodoListItem(todo.doc));
        // });
        var ul = document.getElementById('todo-list');
        ul.innerHTML = '';
        todos.forEach(function (todo) {
            if (classify) ul.appendChild(createTodoListItem(todo));
            else ul.appendChild(createTodoListItem(todo.doc));
        });
    }

    function classifyByCharacter() {
        // var selects = document.querySelector(".active");
        // console.log(selects.innerHTML);
        console.log(quality);
        var ul = document.getElementById('title');
        ul.innerHTML = '性：'+quality;
        db.find({
            selector: {
                quality: {$eq: quality},
            },
        }).then(function (result) {
            // yo, a result
            redrawTodosUI(result.docs,true);
            console.log(result.docs);
        }).catch(function (err) {
            // ouch, an error
        });
    }

    function newTodoKeyPressHandler(event) {
        if (event.keyCode === ENTER_KEY) {
            addTodo(newTodoDom.value);
            newTodoDom.value = '';
        }
    }


    var nodelists = document.querySelectorAll(".mui-btn");
    var selects;
    for (var i = 0; i < nodelists.length; i++) {
        nodelists[i].active = false;
        if (nodelists[i].textContent===quality) nodelists[i].setAttribute("class", "mui-btn mui-btn-outlined active");

        nodelists[i].addEventListener("touchend", function () {
            for (var j = 0; j < nodelists.length; j++) {
                if (nodelists[j].active) {
                    nodelists[j].setAttribute("class", "mui-btn mui-btn-outlined");
                    nodelists[j].active = false;
                    j = nodelists.length;
                }
            }
            if (!this.active)
                this.setAttribute("class", "mui-btn mui-btn-outlined active");
            else
                this.setAttribute("class", "mui-btn mui-btn-outlined");
            this.active = !this.active;

            selects = document.querySelector(".active");
            // console.log(selects.innerHTML);
        });
    }

    document.getElementById("confirm").addEventListener("click", function () {
        if (selects.innerHTML) {
            window.location.href = "medicine-list.html?quality=" + selects.innerHTML;
        }
    });

    if (quality === "undefined") showTodos();
    else if (quality !== "undefined")classifyByCharacter();

    if (remoteCouch) {
        sync();
    }

})();
