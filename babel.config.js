module.exports = {
    _publicPath: process.env.NODE_ENV === 'production' ?
        //'https://change.greenpeace.org.tw/2021/petition-test/webinar-test/' :　'',
        'https://change.greenpeace.org.tw/2021/webinar/DD-webinar-portal/' : '',
    get publicPath() {
        return this._publicPath;
    },
    set publicPath(value) {
        this._publicPath = value;
    },
}