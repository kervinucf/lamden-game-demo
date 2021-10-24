<script>

  const donationAddress = ''

const sendDonation = async () => {
        
        const detail = JSON.stringify({
            //Which Lamden Network to send this to
            //mainnet, testnet are the only acceptable values
            contractName: 'currency',
            methodName: 'transfer',
            networkType: 'mainnet',
            kwargs: {
                amount: 15,  // amount of TAU to approve
                to: donationAddress // contract to approve
            },
            //Could you less but won't be allowed to use more
            stampLimit: 100
        });

        document.dispatchEvent(new CustomEvent('lamdenWalletSendTx', {detail}));

        document.addEventListener('lamdenWalletTxStatus', (response) => {
        var startTx = performance.now();
 
        if (response.detail.status === 'error') {
            //Handle Errors
        }else{

            currentDisplay = 'loading'
            //Do soemething
        } 
        });
    }



</script>

<div class="donate-button">
    <div class="container" on:click={() => sendDonation()}>
      <ul>
         <li><a href="#">Donate</a></li>
      </ul>
    </div>
</div>

<style>


ul {

    position: absolute;
    bottom: 0;
    right: 20px;
}

ul li {
  list-style:none;
  width: 6rem;
  border-radius: 1rem;
}

ul li a {
  position: relative;
  display: block;

  text-align: center;
  line-height: 60px;
  background: #182da3;
  font-size: 20px;
  color: rgb(255, 255, 255);
  transition: .5s;
}

ul li a:before {
  content: '';
  position: absolute;

  width:100%;
  height:100%;
  border-radius:50%;
  background: #4539f5;
  transition: .5s;
  transform: scale(.9);
  z-index: -1;
}

ul li a:hover:before {
  transform: scale(1.2);
  box-shadow: 0 0 15px #4539f5;
  filter: blur(3px);
}

ul li a:hover {
  box-shadow: 0 0 15px #4539f5;
  text-decoration: none;

}

</style>