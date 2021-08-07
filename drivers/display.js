function ST7789() {
    var LCD_WIDTH = 80;
    var LCD_HEIGHT = 160;
    var XOFF = 24;
    var YOFF = 0;
    var cmd = lcd_spi_unbuf.command;

    function dispinit(rst,fn) {
        if (rst) {
            digitalPulse(rst,0,10);
        } else {
            cmd(0x01); //ST7735_SWRESET: Software reset, 0 args, w/delay: 150 ms delay
        }
		D12.set();D26.set();
        setTimeout(function() {
			cmd(0x11); //ST7735_SLPOUT: Out of sleep mode, 0 args, w/delay: 500 ms delay
			setTimeout(function() {
			  cmd(0xb1,[5,0x3c,0x3c]);
			  cmd(0xb2,[5,0x3c,0x3c]);
			  cmd(0xb3,[5,0x3c,0x3c,5,0x3c,0x3c]);
			  cmd(0xb4,3);
			  cmd(0xc0,[0xe0,0,7]);
			  cmd(0xc1,0xc5);
			  cmd(0xc2,[10,0]);
			  cmd(0xc4,[0x8d,0xee]);
			  cmd(0xc5,3);
			  cmd(0xc7,0x76);
			  cmd(0x36,200);
			  cmd(0x3a,5);
			  cmd(0xe0,[0x27,0xe,7,4,0x11,0xb,6,0xc,0xe,0x14,0x1b,0x3e,6,0x25,7,0x1f]);
			  cmd(0xe1,[0x27,0xe,7,4,0x11,0xb,6,0xc,0xe,0x14,0x1b,0x3e,0x30,0x25,7,0x1f]);
			  setTimeout(function(){
				cmd(0x29);
				cmd(0x2a,[0,0x18,0,0x67]);
				cmd(0x2b,[0,0,0,0x9f]);
				if (fn) fn();
			  },120);
			  
			},120);
		  } ,120);
    }

    function connect(options , callback) {
        var spi=options.spi, dc=options.dc, ce=options.cs, rst=options.rst;
        var g = lcd_spi_unbuf.connect(options.spi, {
            dc: options.dc,
            cs: options.cs,
            height: LCD_HEIGHT,
            width: LCD_WIDTH,
            colstart: XOFF,
            rowstart: YOFF
        });
        g.lcd_sleep = function(){cmd(0x10);cmd(0x28);D12.reset();D26.reset();};
        g.lcd_wake = function(){cmd(0x29);cmd(0x11);D12.set();D26.set();};
        dispinit(rst, ()=>{g.clear().setFont("Vector",12).drawString("Expruino",20,20);});
        return g;
    }

    //var spi = new SPI();
    SPI1.setup({mosi:D11, sck:D13, baud: 8000000});

    return connect({spi:SPI1, dc:D19, cs:D22, rst:D20});
}

//screen brightness function
function brightness(v) {
    v=v>7?1:v;	
	digitalWrite([D23,D22,D14],7-v);
}

var g = ST7789();

bpp=16;

function randomLines(){
  g.clear();
  var cols=(bpp==1)?14:(1<<bpp)-1,w=g.getWidth(),h=g.getHeight(),r=Math.random;
  return setInterval(function(){
    g.setColor(1+r()*cols);
    g.drawLine(r()*w,r()*h,r()*w,r()*h);
      g.flip();
  },5);
}

function randomShapes(){
  g.clear();
  var cols=(bpp==1)?14:(1<<bpp)-1,w=g.getWidth()-10,h=g.getHeight()-10,r=Math.random;
  return setInterval(function(){
    g.setBgColor(0);
    g.setColor(1+r()*cols);
    x1=r()*w;x2=10+r()*w;
    y1=r()*h;y2=10+r()*h;
    if (bpp==1 && ((x1&31)==1)) g.clear(); // for bpp==1 clear sometimes so we can see ellipses again
    if (x1&1)
      g.fillEllipse(Math.min(x1,x2), Math.min(y1,y2),Math.max(x1,x2), Math.max(y1,y2));
    else
      g.fillRect(Math.min(x1,x2), Math.min(y1,y2),Math.max(x1,x2), Math.max(y1,y2));
    g.flip();
  },5);
}
