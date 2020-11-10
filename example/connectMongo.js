const mongoose = require('mongoose');

const { connectMongo } = require('../dst/connectMongo');

async function main() {
    // connectMongo({ defaultConnection: true });
    // connectMongo({ defaultConnection: true });

    console.log('typeof mongoose.connection.db:', typeof mongoose.connection.db);
    connectMongo({ defaultConnection: true });
    // await mongoose.connect(process.env.MONGOLAB_URI);
    // console.log('connected!');
    // console.log(await mongoose.connection.db.admin().ping().then((result) => result.ok));

    await connectMongo({ defaultConnection: true });
    // await mongoose.connect(process.env.MONGOLAB_URI);
    console.log('connected!');
    console.log(await mongoose.connection.db.admin().ping().then((result) => result.ok));

    connectMongo({ defaultConnection: true });
    // await mongoose.connect(process.env.MONGOLAB_URI);
    console.log('connected!');
    console.log(await mongoose.connection.db.admin().ping().then((result) => result.ok));

    return;
}

main()
    .then(() => {
        console.log('success!');
    })