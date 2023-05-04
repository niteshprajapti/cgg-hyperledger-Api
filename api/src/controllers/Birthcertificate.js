const { body, check, sanitize, validationResult } = require("express-validator");
const generateUniqueId = require('generate-unique-id');
const postgress = require("../models/postgress")
const invoke = require('../../app/invoke-transaction.js');
const query = require('../../app/query.js');
var log4js = require('log4js');
const date = require('date-and-time')
const XLSX = require("xlsx");
var logger = log4js.getLogger('SampleWebApp');
// const UserModel = require("../models/Birth");
require('../../config.js');
const prometheus = require('prom-client');

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// PROMETHEUS METRICS CONFIGURATION /////////////
///////////////////////////////////////////////////////////////////////////////
const writeLatencyGauge = new prometheus.Gauge({ name: 'write_latency', help: 'latency for write requests' });
const requestCountGauge = new prometheus.Gauge({ name: 'request_count', help: 'requests count' });
const readLatencyGauge = new prometheus.Gauge({ name: 'read_latency', help: 'latency for read requests' });
const queriesCountGauge = new prometheus.Gauge({ name: 'queries_count', help: 'queries count' });
const totalTransaction = new prometheus.Gauge({ name: 'total_transaction', help: 'Counter for total transaction' })
const failedTransaction = new prometheus.Gauge({ name: 'failed_transaction', help: 'Counter for failed transaction' })
const successfulTransaction = new prometheus.Gauge({ name: 'successful_transaction', help: 'counter for successful transaction' })


async function store(req, res, next) {

    try {

        await check("ApplicationID").notEmpty().withMessage('Application ID must be requerd').run(req);
        await check("ChildName").notEmpty().withMessage('Name of the child filed must be requerd').run(req);
        await check("FatherName").notEmpty().withMessage('Name of the father filed must be requerd').run(req);
        await check("MotherName").notEmpty().withMessage('Name of the mother filed must be requerd').run(req);
        await check("DateOfBirth").notEmpty().withMessage('Date of Birth filed must be requerd').run(req);
        await check("Gender").notEmpty().withMessage('please select gender').run(req);
        await check("Country").notEmpty().withMessage('Country filed must be requerd').run(req);
        await check("State").notEmpty().withMessage('State filed must be requerd').run(req);
        await check("City").notEmpty().withMessage('City filed must be requerd').run(req);
        await check("HospitalName").notEmpty().withMessage('hospital Name filed must be requerd').run(req);
        await check("PermanentAddress").notEmpty().withMessage('Permanent Address filed must be requerd').run(req);

        const errors = validationResult(req);
        console.log("errors..........", errors);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        var peers = ["peer0.org1.example.com"];
        var chaincodeName = "birthcert";
        var channelName = "mychannel";
        var fcn = "createBirthCert";

        var args = [];
        const id = generateUniqueId({ length: 64 });

        args.push(req.body.ApplicationID, id, req.body.ChildName, req.body.FatherName, req.body.MotherName, req.body.DateOfBirth, req.body.Gender, req.body.Weight, req.body.Country, req.body.State, req.body.City, req.body.HospitalName, req.body.PermanentAddress);

        console.log("nitesh.........................", args);
        const start = Date.now();
        let message = await invoke.invokeChaincode("admin", channelName, chaincodeName, fcn, args);

        let getUser = await query.queryChaincode("admin", channelName, chaincodeName, 'getBirthCert', [req.body.ApplicationID, id]);
        console.log("ghfghgfhfgh", peers, channelName, chaincodeName, fcn, args, "admin", "Org1");
        console.log("getUser...................", getUser);
        console.log("message", message);
        const latency = Date.now() - start;
        if (typeof message != "string") {

            let data = {
                key: id,
                // tx_id: message,
                Record: {
                    appID: req.body.ApplicationID,
                    name: req.body.ChildName,
                    father_name: req.body.FatherName,
                    mother_name: req.body.MotherName,
                    docType: "birthCert",
                    dob: req.body.DateOfBirth,
                    gender: req.body.Gender,
                    weight: req.body.Weight,
                    country: req.body.Country,
                    state: req.body.State,
                    city: req.body.City,
                    hospital_name: req.body.HospitalName,
                    permanent_address: req.body.PermanentAddress
                },

            }

            writeLatencyGauge.inc(latency)
            requestCountGauge.inc()
            successfulTransaction.inc()
            // const response = yield helper_1.default.registerAndGerSecret(user.email, user.orgname);

            return res.status(400).json({
                status: 400,
                success: false,
                message: "Birthday certificate not inserte!",
                data: data
            })

        } else {

            let data = {
                key: id,
                // tx_id: message,
                Record: {
                    appID: req.body.ApplicationID,
                    name: req.body.ChildName,
                    father_name: req.body.FatherName,
                    mother_name: req.body.MotherName,
                    docType: "birthCert",
                    dob: req.body.DateOfBirth,
                    gender: req.body.Gender,
                    weight: req.body.Weight,
                    country: req.body.Country,
                    state: req.body.State,
                    city: req.body.City,
                    hospital_name: req.body.HospitalName,
                    permanent_address: req.body.PermanentAddress
                },

            }

            postgress.create({
                        Key:id,
                        TransactionID: message,
                        ApplicationID:req.body.ApplicationID,
                        ChildName:req.body.ChildName,
                        FatherName:req.body.FatherName,
                        MotherName:req.body.MotherName,
                        DateOfBirth:req.body.DateOfBirth,
                        Gender:req.body.Gender,
                        Weight:req.body.Weight,
                        Country:req.body.Country,
                        State:req.body.State,
                        City:req.body.City,
                        HospitalName:req.body.HospitalName,
                        PermanentAddress:req.body.PermanentAddress,
                    });

            writeLatencyGauge.inc(latency)
            requestCountGauge.inc()
            successfulTransaction.inc()
            // const response = yield helper_1.default.registerAndGerSecret(user.email, user.orgname);

            return res.status(200).json({
                status: 200,
                success: true,
                message: "Birth certificate inserted successfully!",
                data: data
            })
        }

    } catch (error) {
        res.status(400).json({
            status: 400,
            success: false,
            message: "Somethings went wrong",
            error: error.message
        })
    }
}

async function update(req, res, next) {

    try {

        await check("ApplicationID").notEmpty().withMessage('Application ID must be requerd').run(req);
        await check("Key").notEmpty().withMessage('Key ID must be requerd').run(req);
        await check("ChildName").notEmpty().withMessage('Name of the child filed must be requerd').run(req);
        await check("FatherName").notEmpty().withMessage('Name of the father filed must be requerd').run(req);
        await check("MotherName").notEmpty().withMessage('Name of the mother filed must be requerd').run(req);
        await check("DateOfBirth").notEmpty().withMessage('Date of Birth filed must be requerd').run(req);
        await check("Gender").notEmpty().withMessage('please select gender').run(req);
        await check("Country").notEmpty().withMessage('Country filed must be requerd').run(req);
        await check("State").notEmpty().withMessage('State filed must be requerd').run(req);
        await check("City").notEmpty().withMessage('City filed must be requerd').run(req);
        await check("HospitalName").notEmpty().withMessage('hospital Name filed must be requerd').run(req);
        await check("PermanentAddress").notEmpty().withMessage('Permanent Address filed must be requerd').run(req);

        const errors = validationResult(req);
        console.log("errors..........", errors);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        var peers = ["peer0.org1.example.com"];
        var chaincodeName = "birthcert";
        var channelName = "mychannel";
        var fcn = "createBirthCert";

        let oldData = await query.queryChaincode("admin", channelName, chaincodeName, 'getBirthCert', [req.body.ApplicationID, req.body.Key]);

        if (typeof oldData != "object") {

            var args = [];
            const id = generateUniqueId({ length: 64 });

            args.push(req.body.ApplicationID, id, req.body.ChildName, req.body.FatherName, req.body.MotherName, req.body.DateOfBirth, req.body.Gender, req.body.Weight, req.body.Country, req.body.State, req.body.City, req.body.HospitalName, req.body.PermanentAddress);

            console.log("nitesh.........................", args);
            const start = Date.now();
            let message = await invoke.invokeChaincode("admin", channelName, chaincodeName, fcn, args);

            let getUser = await query.queryChaincode("admin", channelName, chaincodeName, 'getBirthCert', [req.body.ApplicationID, id]);
            console.log("ghfghgfhfgh", peers, channelName, chaincodeName, fcn, args, "admin", "Org1");
            console.log("getUser", getUser);
            console.log("message", message);
            const latency = Date.now() - start;
            if (typeof message != "string") {

                let data = {
                    key: id,
                    old_key: req.body.Key,
                    // tx_id: message,
                    Record: {
                        appID: req.body.ApplicationID,
                        name: req.body.ChildName,
                        father_name: req.body.FatherName,
                        mother_name: req.body.MotherName,
                        docType: "birthCert",
                        dob: req.body.DateOfBirth,
                        gender: req.body.Gender,
                        weight: req.body.Weight,
                        country: req.body.Country,
                        state: req.body.State,
                        city: req.body.City,
                        hospital_name: req.body.HospitalName,
                        permanent_address: req.body.PermanentAddress
                    },

                }

                writeLatencyGauge.inc(latency)
                requestCountGauge.inc()
                successfulTransaction.inc()
                // const response = yield helper_1.default.registerAndGerSecret(user.email, user.orgname);

                return res.status(400).json({
                    status: 400,
                    success: true,
                    message: "Birth certificate not verified",
                    data: data
                })

            } else {

                let data = {
                    key: id,
                    old_key: req.body.Key,
                    // tx_id: message,
                    Record: {
                        appID: req.body.ApplicationID,
                        name: req.body.ChildName,
                        father_name: req.body.FatherName,
                        mother_name: req.body.MotherName,
                        docType: "birthCert",
                        dob: req.body.DateOfBirth,
                        gender: req.body.Gender,
                        weight: req.body.Weight,
                        country: req.body.Country,
                        state: req.body.State,
                        city: req.body.City,
                        hospital_name: req.body.HospitalName,
                        permanent_address: req.body.PermanentAddress
                    },

                }
                postgress.create({
                    Key:id,
                    TransactionID: message,
                    ApplicationID:req.body.ApplicationID,
                    ChildName:req.body.ChildName,
                    FatherName:req.body.FatherName,
                    MotherName:req.body.MotherName,
                    DateOfBirth:req.body.DateOfBirth,
                    Gender:req.body.Gender,
                    Weight:req.body.Weight,
                    Country:req.body.Country,
                    State:req.body.State,
                    City:req.body.City,
                    HospitalName:req.body.HospitalName,
                    PermanentAddress:req.body.PermanentAddress,
                    UpdateRecordKey:req.body.Key,
                });

                writeLatencyGauge.inc(latency)
                requestCountGauge.inc()
                successfulTransaction.inc()
                // const response = yield helper_1.default.registerAndGerSecret(user.email, user.orgname);

                return res.status(200).json({
                    status: 200,
                    success: true,
                    message: "Birth certificate verified and updated successfully!",
                    data: data
                })
            }


        }

        return res.status(400).json({
            status: 400,
            success: false,
            message: "Birth certificate not verified",
            data: ""
        })


    } catch (error) {
        res.status(400).json({
            status: 400,
            success: false,
            message: "Somethings went wrong",
            error: error.message
        })
    }
}

async function importData(req, res, next) {

    try {
        var peers = ["peer0.org1.example.com"];
        var chaincodeName = "birthcert";
        var channelName = "mychannel";
        var fcn = "createBirthCert";

        const wb = XLSX.readFile(req.file.path);
        const sheets = wb.SheetNames;


        if (sheets.length > 0) {
            const data = XLSX.utils.sheet_to_json(wb.Sheets[sheets[0]]);

            const birtData = data.map(row => ([
                generateUniqueId({ length: 64 }),
                row['name'],
                row['father_name'],
                row['mother_name'],
                date.format(new Date((row['date_of_birth'] - 25569) * 86400 * 1000), 'DD-MM-YYYY'),
                row['gender'],
                row['weight'],
                row['country'],
                row['state'],
                row['city'],
                row['hospital_name'],
                row['permanent_address'],
            ]))
            const start = Date.now();
            const latency = Date.now() - start;
            const _importData = [];

            birtData.forEach(async (args, i) => {
                setTimeout(async () => {
                    await invoke.invokeChaincode("admin", channelName, chaincodeName, fcn, args);
                }, i * 1000);

                _importData.push({
                    key: args[0],
                    Record: {
                        name: args[1],
                        father_name: args[2],
                        mother_name: args[3],
                        docType: "birthCert",
                        dob: args[4],
                        gender: args[5],
                        weight: args[6],
                        country: args[7],
                        state: args[8],
                        city: args[9],
                        hospital_name: args[10],
                        permanent_address: args[11]
                    }
                })
            });


            return res.status(200).json({
                status: 200,
                success: true,
                message: "Birthday certificate validated successfully!",
                data: _importData
            })

        }

        return res.status(200).json({
            status: 400,
            success: false,
            message: "Somthing went wrong!",
            data: ""
        })


    }
    catch (error) {
        res.status(400).json({
            status: 400,
            success: false,
            message: "Somethings went wrong",
            error: error.message
        })
    }
}


async function index(req, res, next) {
    try {

        var channelName = "mychannel";
        var chaincodeName = "birthcert";
        let args = req.query.args;
        let fcn = 'allList';


        if (!args) {
            res.json(getErrorMessage('\'args\''));
            return;
        }
        console.log('args==========', args);
        args = args.replace(/'/g, '"');
        args = JSON.parse(args);
        logger.debug(args);

        const start = Date.now();
        let message = await query.queryChaincode("admin", channelName, chaincodeName, fcn, args);
        // message = message.replace(/'/g, '"');
        const latency = Date.now() - start;
        readLatencyGauge.inc(latency)
        queriesCountGauge.inc()
        data = JSON.parse(message)
        return res.status(200).json({
            status: 200,
            success: true,
            message: "All User found successfully",
            data: data
        })

    } catch (error) {
        res.status(400).json({
            status: 400,
            success: false,
            message: "Somethings went wrong",
            error: error.message
        })
    }
}

async function show(req, res, next) {
    try {

        var channelName = "mychannel";
        var chaincodeName = "birthcert";
        let args = req.query.args;;
        let fcn = 'getBirthCert';

        if (!args) {
            res.json(getErrorMessage('\'args\''));
            return;
        }
        console.log('args==========', args);
        args = args.replace(/'/g, '"');
        args = JSON.parse(args);
        logger.debug(args);

        const start = Date.now();
        let message = await query.queryChaincode("admin", channelName, chaincodeName, fcn, args);
        // message = message.replace(/'/g, '"');
        const latency = Date.now() - start;
        readLatencyGauge.inc(latency)
        queriesCountGauge.inc()
        logger.debug("Data............", message);
        if (typeof message != "object") {

            data = JSON.parse(message)
            data = {
                key: args[0],
                Record: data
            }

            return res.status(200).json({
                status: 200,
                success: true,
                message: "Validated successfully!",
                data: data
            })

        } else {
            return res.status(00).json({
                status: 400,
                success: false,
                message: "Not valid!",
                data: ""
            })

        }


    } catch (error) {
        res.status(400).json({
            status: 400,
            success: false,
            message: "Somethings went wrong",
            error: error.message
        })
    }
}


exports.store = store;
exports.update = update;
exports.index = index;
exports.show = show;
exports.importData = importData;
