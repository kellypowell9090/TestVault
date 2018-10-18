
async function testA(context){
    
    let promise = new Promise((resolve, reject) => {
        setTimeout(() => resolve("done!"), 7000)
      });

      
   // let result = await promise; // wait till the promise resolves (*)

    context.log("The result inside testA is: " + promise);
    return promise;
}

module.exports = async function  (context, req) {
    context.log('v1.7: Vault test running');
    let mysecret = "test";

    let x = await testA(context);
    context.log("Done testA. Result..." + x);


    if (req.query.name || (req.body && req.body.name)) {
        context.res = {
            body: "Hello: " + (req.query.name || req.body.name) 
            + ", Secret: " + mysecret
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
};