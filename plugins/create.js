const Promise = require('bluebird');

module.exports = function (options) {
    const { mongoConnection } = options;
    const act = Promise.promisify(this.act, { context: this });

    this.add({ role: 'cooperative', cmd: 'create' }, (msg, done) => {

        const { cooperative } = msg;

        // validation should be performed

        act({ role: 'acl', cmd: 'check' }) // check permissions
            .then(res => {
                if (!res.allow) {
                    throw new Error(403);
                }
                return mongoConnection;
            })
            .then(db => db.collection('cooperatives').insert(cooperative))
            .then(res => res.ops[0])
            .then(res => done(null, res))
            .catch(err => {
                done(err);
            });

    });
};
