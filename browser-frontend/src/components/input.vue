<template>
    <div class="input-group mb-3">
        <form action="http://127.0.0.1:13504/redirect-authorize" method="POST">
            <span class="input-group-text" id="basic-addon1">@</span>
            <input type="text" class="form-control" placeholder="Username" aria-label="Username" aria-describedby="basic-addon1">
            <input type="submit" value="Submit">
        </form>
    </div>
</template>

<script>
import 'bootstrap/dist/css/bootstrap.min.css';
import 'jquery/src/jquery.js';
import 'bootstrap/dist/js/bootstrap.min.js';


export default {
    data() {

    }
}
</script>
