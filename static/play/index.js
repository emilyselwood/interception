var canvas = document.getElementById( 'c' ),
    w = canvas.width = window.innerWidth,
    h = canvas.height = window.innerHeight,
    ctx = c.getContext( '2d' ),

    cx = w / 2,
    cy = h / 2,

    data = {},
    player = {},
    tick = 0,
    scale = 1,

    gradients = {},

    currentQuestion = {},

    bgCanvas = document.createElement( 'canvas' ),
    bgCtx = bgCanvas.getContext( '2d' );

data.location = window.location.hash.substr(1) || 'peru';
data.loaded = false;

function setupGradients(){
    
    gradients.questionDone = ctx.createRadialGradient( -3 * scale, -3 * scale, 0, 0, 0, scale * 6 );
    gradients.questionDone.addColorStop( 0, '#4b5' );
    gradients.questionDone.addColorStop( .9, '#394' );
    gradients.questionDone.addColorStop( .999999, '#121' );
    gradients.questionDone.addColorStop( 1, 'rgba(0,0,0,0)' );

    gradients.questionNotDone = ctx.createRadialGradient( -3 * scale, -3 * scale, 0, 0, 0, scale * 6 );
    gradients.questionNotDone.addColorStop( 0, '#696' );
    gradients.questionNotDone.addColorStop( .9, '#575' );
    gradients.questionNotDone.addColorStop( .999999, '#222' );
    gradients.questionNotDone.addColorStop( 1, 'rgba(0,0,0,0)' );

    gradients.player = ctx.createRadialGradient( -5 * scale, -5 * scale, 0, 0, 0, scale * 10 );
    gradients.player.addColorStop( 0, '#4ac' );
    gradients.player.addColorStop( .9, '#368' );
    gradients.player.addColorStop( .99999, '#134' );
    gradients.player.addColorStop( 1, 'rgba(0,0,0,0)' );
}
function displayLoading( dots ){

    ctx.fillStyle = '#222';
    ctx.fillRect( 0, 0, w, h );

    ctx.font = '50px Verdana';

    var text = data.location.split('');
    text[ 0 ] = text[ 0 ].toUpperCase();
    text = 'Loading ' + text.join('');

    ctx.fillStyle = '#eee';
    ctx.fillText( text + ( Array( dots ).fill('.').join('') ), cx - ( ( ctx.measureText( text ).width / 2 ) | 0 ), cy - 25 );
}

function fillBackground(){

    bgCanvas.width = w;
    bgCanvas.height = h;

    bgCtx.lineWidth = scale * 5;
    bgCtx.strokeStyle = '#eee';

    var points = data.points,
        x = points[ 0 ].x * scale + cx,
        y = points[ 0 ].y * scale + cy;
    
    bgCtx.beginPath();
    bgCtx.moveTo( x, y );
    
    for( var i = 0; i < points.length; ++i ){
        
        var x2 = points[ i ].x * scale + cx,
            y2 = points[ i ].y * scale + cy,
                
            mx = ( x + x2 ) / 2,
            my = ( y + y2 ) / 2;
        
        bgCtx.quadraticCurveTo( x, y, mx, my );
        
        x = x2;
        y = y2;
        
    }
    
    bgCtx.lineTo( points[ points.length - 1 ].x * scale + cx, points[ points.length - 1 ].y * scale + cy );
    
    bgCtx.stroke();
}

(function init(){

    anim();
    
   var xhr = new XMLHttpRequest;
   xhr.open( 'GET', data.location + '-data.json' );
   xhr.onload = function(){
        
        data.loaded = true;
        var object = JSON.parse( xhr.responseText );
        data.questions = object.questions;
        data.points = object.points;
	data.sections = object.sections;

	data.score = 0;

        player.x = data.questions[ 0 ].point.x * scale + cx;
        player.y = data.questions[ 0 ].point.y * scale + cy;
        player.n = -1;
	player.moving = true;

	incrementLevel();

        fillBackground();
  }
  
  setupGradients();

})();

function incrementLevel(){
    
    ++player.n;

    if( player.n > data.questions.length )
        return finishModal();

    player.end = data.questions[ player.n ].point;
    player.dx = player.end.x - player.x;
    player.dy = player.end.y - player.y;

    player.moving = true;

    anim();
}
function finishModal(){

}
function drawQuestion( question ){

    var x = question.point.x * scale + cx,
	y = question.point.y * scale + cy,
	done = question.done;

    ctx.fillStyle = done ? gradients.questionDone : gradients.questionNotDone;
    ctx.translate( x, y );
    ctx.beginPath();
    ctx.arc( 0, 0, scale * 6, 0, Math.PI * 2 );
    ctx.fill();
    ctx.translate( -x, -y );

}
function drawPlayer( armonic ){

    var x = ( player.x + player.dx * armonic ) * scale + cx,
        y = ( player.y + player.dy * armonic ) * scale + cy;

    ctx.fillStyle = gradients.player;
    ctx.translate( x, y );
    ctx.beginPath();
    ctx.arc( 0, 0, scale * 10, 0, Math.PI * 2 );
    ctx.fill();
    ctx.translate( -x, -y );
    
}

function displayQuestion( question ){

    var element = document.createElement( 'div' );
    element.className = 'popup';
    element.style.setProperty( 'top', question.point.y );
    element.style.setProperty( 'left', question.point.x );

    var sectionText = '';
    for( var i = 0; i < data.sections.length; ++i )
        if( data.sections[ i ].name === question.section )
	   sectionText = data.sections[ i ].content;
    
    element.innerHTML = '<div class="section">\
                            <p>SECTION</p>\
			 </div>\
			 <div class="main">\
                            <div class="question">\
                               QUESTION\
			    </div>\
			    <div class="answers">\
			       <div class="options">\
			       </div>\
			       <div class="image">\
			          <img src="IMG-SRC">\
			       </div>\
			    </div>\
			 </div>'
	.replace( 'SECTION', '<b>' + question.section + '</b>' + ' - ' + sectionText )
	.replace( 'QUESTION', '<h1>' + question.index + '</h1><p>' + question.content + '</p>' )
	.replace( 'IMG-SRC', question.imageSrc );

    var optionsEl = element.querySelector( '.options' );

    currentQuestion.answers = [];
    currentQuestion.markedAnswers = 0;
    currentQuestion.maxAnswers = question.maxAnswers;

    for( var i = 0; i < question.answers.length; ++i ){
    
        var answer = question.answers[ i ],
	    
	    optionEl = document.createElement( 'p' ),
	    clickable = document.createElement( 'button' ),
	    contentEl = document.createElement( 'span' );

	contentEl.textContent = answer.content;

	optionEl.appendChild( clickable );
	optionEl.appendChild( contentEl );

	optionsEl.appendChild( optionEl );

	clickable.addEventListener( 'click', new Function( getClick( i ) ) );
        
	currentQuestion.answers.push( { marked: false, weight: answer.weight } );
    }

    var sendEl = document.createElement( 'button' );
    sendEl.className = 'sendBtn';
    sendEl.textContent = "continue";
    sendEl.addEventListener( 'click', (function( element ){
       
        return function(){
	    
	    document.querySelector( 'div.popup' ).classList.add( 'disappear' );

	    var score = 0;
	    for( var i = 0; i < currentQuestion.answers.length; ++i )
	        if( currentQuestion.answers[ i ].marked )
		    score += currentQuestion.answers[ i ].weight;

            data.score += score;

	    window.setTimeout( function(){
	        
		document.body.removeChild( document.querySelector( 'div.popup' ) );

		incrementLevel();

	    }, 200 );
	}
    })() );

    element.appendChild( sendEl );
    document.body.appendChild( element );

    window.setTimeout( (function( element ){
        return function(){
 
            element.classList.add( 'active' );

	    element.style.setProperty( 'top', 'calc( 50% - 250px )' );
	    element.style.setProperty( 'left', 'calc( 50% - 250px )' );

	}
    } )( element ), 4 )
}
function getClick( index ){

    return '\
\
        var answer = currentQuestion.answers[ index ];\
        \
	if( answer.marked ){\
	\
            --currentQuestion.markedAnswers;\
	    answer.marked = false;\
	    document.querySelectorAll( "div.popup .options p" )[ index ].className = "";\
\
	} else if( currentQuestion.markedAnswers < currentQuestion.maxAnswer ){\
	\
	    ++currentQuestion.markedAnswers;\
	    answer.marked = true;\
	    document.querySelectorAll( "div.popup .options p" )[ index ].className = "marked";\
	}'
     .replace( /index/g, index );
}

function anim(){

    if( player.moving || data.loaded === false )
        window.requestAnimationFrame( anim );
    
    ++tick;
    var status = '0';
  
    if( data.loaded  ){ status += '1';

        ctx.fillStyle = '#222';
	ctx.fillRect( 0, 0, w, h );

        ctx.drawImage( bgCanvas, 0, 0 );
        
	for( var i = 0; i < data.questions.length; ++i )
	    drawQuestion( data.questions[ i ] );
        
        var proportion = tick / 60;
	drawPlayer( -Math.cos( proportion * Math.PI ) / 2 + .5 );

	if( proportion >= 1 ){ status += '2';
	
	    player.x = player.end.x;
	    player.y = player.end.y;
	    player.moving = false;
	    tick = 0;

	    displayQuestion( data.questions[ player.n ] );
	}

    } else displayLoading( ( ( tick / 10 ) |0 ) % 4 );

    console.log( status );
}
