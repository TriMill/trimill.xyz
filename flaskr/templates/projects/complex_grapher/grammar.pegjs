{{
    function toFixed(x) {
        if (Math.abs(x) < 1.0) {
            var e = parseInt(x.toString().split('e-')[1]);
            if (e) {
                x *= Math.pow(10,e-1);
                x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
            }
        } else {
            var e = parseInt(x.toString().split('+')[1]);
            if (e > 20) {
                e -= 20;
                x /= Math.pow(10,e);
                x += (new Array(e+1)).join('0');
            }
        }
        x = x.toString();
		if(!x.includes(".")) {
			x += ".";
    	}
        return x;
    }
    
    class OpAdd {
    	constructor(left, right) {
        	this.left = left;
            this.right = right;
        }
        gen(ctx) {
        	return "(" + this.left.gen(ctx) + "+" + this.right.gen(ctx) + ")";
        }
        reduce() {
            const left = this.left.reduce();
            const right = this.right.reduce();
            if(left !== null && right !== null) {
                return new Vec2(left.re + right.re, left.im + right.im);
            } else {
                if(left !== null) {
                    this.left = left;
                } else if(right !== null) {
                    this.right = right;
                }
                return null
            }
        }
    }
    class OpSub {
    	constructor(left, right) {
        	this.left = left;
            this.right = right;
        }
        gen(ctx) {
        	return "(" + this.left.gen(ctx) + "-" + this.right.gen(ctx) + ")";
        }
        reduce() {
            const left = this.left.reduce();
            const right = this.right.reduce();
            if(left !== null && right !== null) {
                return new Vec2(left.re - right.re, left.im - right.im);
            } else {
                if(left !== null) {
                    this.left = left;
                } else if(right !== null) {
                    this.right = right;
                }
                return null
            }
        }
    }
    class OpNeg {
    	constructor(arg) {
        	this.arg = arg;
        }
        gen(ctx) {
        	return "(-(" + this.arg.gen(ctx) + "))";
        }
        reduce() {
            const arg = this.arg.reduce();
            if(arg !== null) {
                return new Vec2(-arg.re, -arg.im);
            } else {
                return null
            }
        }
    }
    class Fn {
    	constructor(name, args, argoff) {
			this.name = name;
        	this.args = args;
            this.argoff = argoff;
        }
        gen(ctx) {
            let name = this.name + "$" + this.args.length;
            if(ctx[name] === undefined) {
                throw "Error: the function " + this.name + " does not exist or has the wrong number of arguments";
            }
            if(this.argoff != null) {
                name += "_o";
            }
            if(ctx[name] === undefined) {
                throw "Error: the function " + this.name + " cannot take an argument offset";
            }
            let s = ctx[name] + "(";
            if(this.argoff != null) {
                s += toFixed(this.argoff) + ",";
            }
            for(const a of this.args) {
                s += a.gen(ctx) + ",";
            }
            s = s.slice(0,-1) + ")";
        	return s;
        }
        reduce() {
            for(const i in this.args) {
                const a = this.args[i];
                const r = a.reduce();
                if(r !== null) {
                    this.args[i] = r;
                }
            }
            return null;
        }
    }
    class Variable {
    	constructor(name) {
			this.name = name;
        }
        gen(ctx) {
            if(ctx[this.name] === undefined) {
                throw "Error: " + this.name + " is not a variable";
            }
        	return ctx[this.name];
        }
        reduce() {
            return null;
        }
    }
    class Vec2 {
		constructor(re, im) {
        	this.re = re;
            this.im = im;
        }
        gen(ctx) {
        	return "vec2(" + toFixed(this.re) + "," + toFixed(this.im) + ")";
        }
        reduce() {
            return this;
        }
    }
    class Conditional {
        constructor(cond) {
            this.cond = cond;
        }
        gen(ctx) {
            let res = "";
            for(const part of this.cond) {
                if(part.length == 2) {
                    res += "(" + part[0].gen(ctx) + ").x>0.0 ? (" + part[1].gen(ctx) + ") : ";
                } else {
                    res += part[0].gen(ctx);
                }
            }
            return "(" + res + ")";
        }
        reduce() {
            return null;
        }
    }
}}

Level0
  = head:Level1 tail:(_ ("+" / "-") _ Level1)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "+") { return new OpAdd(result, element[3]); }
        if (element[1] === "-") { return new OpSub(result, element[3]); }
      }, head);
    }

Level1
  = head:Level2 tail:(_ ("*" / "/") _ Level2)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "*") { return new Fn("*", [result, element[3]]); }
        if (element[1] === "/") { return new Fn("/", [result, element[3]]); }
      }, head);
    }

Level2
  = head:(Level3 _ "^" _)* tail:Level3 {
      return head.reverse().reduce(function(result, element) {
        return new Fn("^", [element[0], result]);
      }, tail);
    }

Level3
  = _ "(" _ expr:Level0 _ ")" { return expr; }
  / _ "{" _ cond:ConditionalInner _ "}" { return new Conditional(cond); }
  / _ name:Name _ argoff:("[" _ ArgOffset _ "]" _)? "(" args:ParameterList ")" {
    if(typeof(name) == "string") {
        return new Fn(name, args.reverse(), argoff == null ? null : argoff[2]);
    } else {
        throw "Error: i is not a function";
    }
  }
  / _ name:Name {
    if(typeof(name) == "string") {
        return new Variable(name);
    } else {
        return name;
    }
  }
  / Imag / Real
  / _ "-" e:Level1 { return new OpNeg(e); }

ArgOffset 
 = n:Real _ ("tau" / "τ" / "t") {
    console.log("AAA", n.re);
    return n.re * 6.283185307179586;
 }
 / n:Real _ ("pi" / "π" / "p") {
    return n.re * 3.141592653589793;
 }
 / n:Real {
    return n.re;
 }

ParameterList
 = _ arg:Level0 _ "," lst:ParameterList { 
    lst.push(arg);
    return lst;
}
 / _ arg:Level0 _ { return [arg]; }

ConditionalInner
 = _ cond:Level0 _ ":" _ expr:Level0 _ "," _ rest:ConditionalInner _ { return [].concat([[cond, expr]],rest); }
 / _ expr:Level0 _ { return [[expr]]; }

Name "varname"
  = [a-zA-Z_√Γπτγ]+ {
    if(text() === "i") {
        return new Vec2(0,1);
    } else {
        return text();
    }
  }

Real "real"
  = _ Number { 
  	return new Vec2(parseFloat(text()),0); 
  }
  
Imag "imag"
  = _ Number "i" { 
  	return new Vec2(0,parseFloat(text())); 
  }

Number "number"
 = [+-]? Digits "." Digits
 / [+-]? Digits "."
 / [+-]? "." Digits
 / [+-]? Digits

Digits "digits"
 = [0-9]+

_ "whitespace"
  = [ \t\n\r]*
