<script>

    export let transactionStatus;
    export let transactionTime = 0;
    export let stampsUsed;
    export let txHash = '';

    function NewTab(link) { 
            window.open( 
              link, "_blank"); 
	} 
	
	function setResultTxn() {
		return localStorage.getItem("result-txn")
	}
	function setScore() {
		return localStorage.getItem("score")
	}

</script>



<html>
    <body>
        <div class="boxes">
            <div class="box">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="box">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="box">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="box">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>

        <div style="margin-left:2rem;">

			{#if (transactionStatus)}
			<div>
                Transaction Status: <span style="color:#78FF00">{transactionStatus}</span>
            </div>
            <div>
                Transaction Completed in <span style="color:white">{transactionTime.toFixed(3)}</span> seconds
            </div>
            <div>
                Stamps used: <span style="color:#ec1111">{stampsUsed}</span>
            </div>
            <div>
                Buy Txn: <a style="color:rgb(85, 244, 255);font-size:small" href="#" on:click={() => NewTab('https://mainnet.lamden.io/transactions/' + txHash.toLowerCase())}>{txHash}</a>
			</div>
			<div>
				Game Txn: <a id="result-txn" style="color:rgb(85, 244, 255);font-size:small" href="#" on:click={() => NewTab('https://mainnet.lamden.io/transactions/' + setResultTxn().toLowerCase())}>{setResultTxn()}</a>
			</div>
			<div>
				Score: <span style="color:white">{setScore()}</span>
            </div>
            <div style="margin-top:1rem;text-align:center">
                <span style="color:white">(</span><span style="color:#78FF00">Press A to start</span><span style="color:white">)</span>
			</div>
			{:else}
			<div>
                <span class="error">Please begin a game to view transactions</span>
            </div>
			{/if}
        </div>
        
    </body>
</html>


<style>

    .boxes {
	 --size: 32px;
	 --duration: 800ms;
	 height: calc(var(--size) * 2);
	 width: calc(var(--size) * 3);
	 position: relative;
	 transform-style: preserve-3d;
	 transform-origin: 50% 50%;
	 margin-top: calc(var(--size) * 1.5 * -1);
	 transform: rotateX(60deg) rotateZ(45deg) rotateY(0deg) translateZ(0px);
}
 .boxes .box {
	 width: var(--size);
	 height: var(--size);
	 top: 0;
	 left: 0;
	 position: absolute;
	 transform-style: preserve-3d;
}
 .boxes .box:nth-child(1) {
	 transform: translate(100%, 0);
	 animation: box1 var(--duration) linear infinite;
}
 .boxes .box:nth-child(2) {
	 transform: translate(0, 100%);
	 animation: box2 var(--duration) linear infinite;
}
 .boxes .box:nth-child(3) {
	 transform: translate(100%, 100%);
	 animation: box3 var(--duration) linear infinite;
}
 .boxes .box:nth-child(4) {
	 transform: translate(200%, 0);
	 animation: box4 var(--duration) linear infinite;
}
 .boxes .box > div {
	 --background: #5c8df6;
	 --top: auto;
	 --right: auto;
	 --bottom: auto;
	 --left: auto;
	 --translateZ: calc(var(--size) / 3.5);
	 --rotateY: 0deg;
	 --rotateX: 0deg;
	 position: absolute;
	 width: 60%;
	 height: 60%;
	 background: var(--background);
	 top: var(--top);
	 right: var(--right);
	 bottom: var(--bottom);
	 left: var(--left);
	 transform: rotateY(var(--rotateY)) rotateX(var(--rotateX)) translateZ(var(--translateZ));
}
 .boxes .box > div:nth-child(1) {
	 --top: 0;
	 --left: 0;
}
 .boxes .box > div:nth-child(2) {
	 --background: #3d14f2;
	 --right: -4;
	 --rotateY: 90deg;
}
 .boxes .box > div:nth-child(3) {
	 --background: #4744f5;
	 --rotateX: -90deg;
}
 .boxes .box > div:nth-child(4) {
	 --background: #ffffffe7;
	 --top: 0;
	 --left: 0;
	 --translateZ: calc(var(--size) * 3 * -1);
}
 @keyframes box1 {
	 0%, 50% {
		 transform: translate(100%, 0);
	}
	 100% {
		 transform: translate(200%, 0);
	}
}
 @keyframes box2 {
	 0% {
		 transform: translate(0, 100%);
	}
	 50% {
		 transform: translate(0, 0);
	}
	 100% {
		 transform: translate(100%, 0);
	}
}
 @keyframes box3 {
	 0%, 50% {
		 transform: translate(100%, 100%);
	}
	 100% {
		 transform: translate(0, 100%);
	}
}
 @keyframes box4 {
	 0% {
		 transform: translate(200%, 0);
	}
	 50% {
		 transform: translate(200%, 100%);
	}
	 100% {
		 transform: translate(100%, 100%);
	}
}
 html {
	 -webkit-font-smoothing: antialiased;
}
 * {
	 box-sizing: border-box;
}
 *:before, *:after {
	 box-sizing: border-box;
}
 body {
    font-family: "VT323", monospace;
    text-transform: uppercase;
    color: #adafb6;
	display: flex;
	justify-content: center;
	align-items: center;
}
 body .dribbble {
	 position: fixed;
	 display: block;
	 right: 20px;
	 bottom: 20px;
}
 body .dribbble img {
	 display: block;
	 height: 28px;
}
 
</style>
