function jpvs(onready) {
    $(document).ready(onready);
}

jpvs.property = function (propdef) {
    return function (value) {
        if (value === undefined)
            return propdef.get.call(this);
        else
            return propdef.set.call(this, value);
    };
};

jpvs.bind = function () {
    return function () {
        this.elem.bind.apply(this.elem, arguments);
    };
};