let localStream
let peerConnection
let remoteStream
const socket = io('http://localhost:5001')
let APP_ID="410105d144c1438a9fa83ad36d268aa9"

let roomId=new URLSearchParams(window.location.search).get('room')
let token = null

let uid=Math.floor(Math.random()*100000).toString()

if(!roomId){
    window.location='lobby.html'
}

let client;
let channel;

const servers={
    iceServers:[
        {
            urls:['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']
        }
    ]
}

let constrains={
    video:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    },
    audio:true
}

let init = async ()=>{
    // client=await AgoraRTM.createInstance(APP_ID, {enableLogUpload: false})
    // await client.login({uid,token})
    // channel=client.createChannel(roomId)
    // await channel.join()
    // socket..on('MemberLeft', handleUserLeft)
    // channel.on('MemberJoined', handleUserJoined)
    // channel.on('MemberLeft', handleUserLeft)
    // client.on('MessageFromPeer', handleMessageFromPeer)
     socket.emit('login',{uid} )
     socket.on('MemberJoined',handleUserJoined)
     socket.on('MessageFromPeer', handleMessageFromPeer)


  if(!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia(constrains)
      document.getElementById('user-1').srcObject=localStream
  }

}

let handleUserJoined=async (MemberId)=>{
    console.log('MemberId', MemberId)
    await createOffer(MemberId)
}

let handleUserLeft=(MemberId)=>{
    document.getElementById('user-2').style.display='none'
    document.getElementById('user-1').classList.remove('smallFrame')
}

let handleMessageFromPeer=async (message,MemberId)=>{
    message=JSON.parse(message.text)
    console.log('Message', message.text)
    if(message.type==='offer'){
        createAnswer(MemberId,message.offer)
    }
    if(message.type==='answer'){
        addAnswer(message.answer)
    }

    if(message.type==='candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }
}

let createPeerConnection=async (MemberId)=>{
    peerConnection=new RTCPeerConnection(servers)
    remoteStream=new MediaStream()
    document.getElementById('user-2').srcObject=remoteStream
    document.getElementById('user-1').classList.add('smallFrame')
    document.getElementById('user-2').style.display='block'

    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true})
        document.getElementById('user-1').srcObject=localStream
    }

    localStream.getTracks().forEach(track=>{
        console.log('tracks1', track)
        peerConnection.addTrack(track,localStream)
    })

    peerConnection.ontrack=event=>{
        console.log('event', event)
        event.streams[0].getTracks().forEach(track=>{
            console.log('tracks', track)
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate=async (event)=>{
        if(event.candidate){
            socket.emit('sendMessageToPeer',{text:JSON.stringify({'type':"candidate",'candidate':event.candidate}), MemberId})
            // client.sendMessageToPeer({text:JSON.stringify({'type':"candidate",'candidate':event.candidate})}, MemberId)
            console.log('new ice', event.candidate)
        }
    }
}

let createOffer=async (MemberId)=>{
    await createPeerConnection(MemberId)
    let offer=await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    socket.emit('sendMessageToPeer',{text:JSON.stringify({'type':"offer",'offer':offer}), MemberId})
    // client.sendMessageToPeer({text:JSON.stringify({'type':"offer",'offer':offer})}, MemberId)
}

let createAnswer=async (MemberId,offer)=>{
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)

    let answer=await peerConnection.createAnswer()

    await peerConnection.setLocalDescription(answer)
    socket.emit('sendMessageToPeer',{text:JSON.stringify({'type':"answer",'answer':answer}), MemberId})
    // client.sendMessageToPeer({text:JSON.stringify({'type':"answer",'answer':answer})}, MemberId)
}

let addAnswer=async (answer)=>{
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

let leaveChannel=async ()=>{
    await channel.leave()
    await client.logout()
}

let toggleCamera=async ()=>{
    let videoTrack=localStream.getTracks().find(track=>track.kind==='video')

    if(videoTrack.enabled){
        videoTrack.enabled=false
        document.getElementById('camera-btn').style.backgroundColor='rgb(255,80,80)'
    }else{
        videoTrack.enabled=true
        document.getElementById('camera-btn').style.backgroundColor='rgba(179,102,259,0.9)'
    }
}


let toggleMic=async ()=>{
    let audioTrack=localStream.getTracks().find(track=>track.kind==='audio')
    if(!audioTrack){
        return
    }
    if(audioTrack.enabled){
        audioTrack.enabled=false
        document.getElementById('mic-btn').style.backgroundColor='rgb(255,80,80)'
    }else{
        audioTrack.enabled=true
        document.getElementById('mic-btn').style.backgroundColor='rgba(179,102,259,0.9)'
    }
}

window.addEventListener('beforeunload', leaveChannel)
document.getElementById('camera-btn').addEventListener('click',toggleCamera)
document.getElementById('leave-btn').addEventListener('click',leaveChannel)
document.getElementById('mic-btn').addEventListener('click',toggleMic)
init()