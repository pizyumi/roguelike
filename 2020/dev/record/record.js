$(function () {
    var app = new Vue({
        el: '#app',
        data: {
            versions: []
        }, 
        methods: {
            names: function (version) {
                var params = {
                    version: version.name
                };
                axios.get('/get-names', { params: params }).then((res) => {
                    version.names = res.data.map((item) => {
                        return { name: item, records: [] };
                    });
                }).catch((err) => {
                }).finally(() => {
                });
            }, 
            records: function (version, name) {
                var params = {
                    version: version.name, 
                    name: name.name
                };
                axios.get('/get-records', { params: params }).then((res) => {
                    name.records = res.data.map((item) => {
                        return { name: item };
                    });
                }).catch((err) => {
                }).finally(() => {
                });
            }, 
            record: function (version, name, record) {
                var params = {
                    version: version.name, 
                    name: name.name, 
                    record: record.name, 
                }
                axios.get('/get-record', { params: params }).then((res) => {
                    var record_elem = $('#record');
                    record_elem.empty();

                    create_statistics_html(record_elem, res.data, true);
                }).catch((err) => {
                }).finally(() => {
                });            
            }
        }
    });

    axios.get('/get-versions', {}).then((res) => {
        app.versions = res.data.map((i) => {
            return { name: i, names: [] };
        });
    }).catch((err) => {
    }).finally(() => {
    });
});
