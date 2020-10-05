const main = {
    data() {
        return {
            mode: "search",
            tx: "",
            breadcrumb: "breadcrumb",
            items: [],
            item: {price: {}},
            error: ''
        }
    },
    computed: {
        showSearch(){
            return (this.mode == 'item_list' || this.mode == 'detail' || this.error != '') ? true : false;
        },
        showItemLists(){
            return this.mode == 'item_list';
        },
        showDetail(){
            return this.mode == 'detail';
        }
    },
    created() {
        window.addEventListener('popstate', (e) => {
            this.router();
        });
    },
    mounted(){
        this.router();
    },
    methods: {
        router(){
            let url = window.location.href;
            if(url.includes('/items?search=')){
                this.tx = getQueryString(decodeURIComponent(window.location.href)).search;
                this.goToSearch();            
            }else if(url.includes("/items/")){
                this.goToDetail(extractProductId((window.location.href)));
            }else{
                this.tx = "";
                this.item = {};
                this.items = [];
                this.error = "";
                this.mode = "search";
            }
        },
        goToInit(){
            window.open('http://localhost:4500/','_self');
        },
        goToSearch(){
            history.pushState(null,'',`/items?search=${this.tx}`);
            let q = getQueryString(decodeURIComponent(window.location.href)).search;
            if(!q || q == ''){
                this.error = 'Por favor ingrese el texto a buscar';
                return;
            }
            httpGet('http://localhost:4500/api/items',{"q":q},(data) => {
                this.mode = "item_list";
                this.items = data.items;
                this.items.forEach(obj => {
                    obj.price.amount = convNum(obj.price.amount);
                });
            });
        },
        goToDetail(id, ev){
            history.pushState(null,'',`/items/${id}`);
            if(!id || id == ''){
                this.error = 'Por favor ingrese un producto válido';
                return;
            }
            httpGet(`http://localhost:4500/api/items/${id}`,{},(data) => {
                this.mode = "detail";
                this.item = data.item;
                this.item.condition = this.item.condition.substring(0,1).toUpperCase() + this.item.condition.substring(1);
                this.item.price.amount = convNum(this.item.price.amount);
                let d = this.item.price.decimals.toString();
                this.item.price.decimals = d.length == 1 ? d + '0' : d.substring(3,5);
            });
        }
    }
};
Vue.createApp(main).mount('#main');