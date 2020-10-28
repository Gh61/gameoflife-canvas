var kox;
(function (kox) {
    function intObservable(value) {
        var backingObservable = value ? ko.observable(value) : ko.observable();
        return ko.computed({
            write: value => { backingObservable(parseInt(value)); },
            read: () => { return backingObservable(); }
        });
    }
    kox.intObservable = intObservable;
})(kox || (kox = {}));
//# sourceMappingURL=utils.js.map