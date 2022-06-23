#version 300 es
precision highp float;
#define MAX_ITERS 1000
#define TAU 6.283185307179586

#define TAU 6.283185307179586
#define CONST_E vec2(2.718281828459045,0.)
#define CONST_PI vec2(TAU*.5,0.)
#define CONST_TAU vec2(TAU,0.)
#define CONST_EMGAMMA vec2(0.5772156649015329,0.)

uniform highp vec2 uResolution;
uniform highp vec4 uRangeAxes;
uniform int uDrawContours;
uniform int uIterations;
uniform float uShadingIntensity;
uniform int uSwapBlackWhite;
uniform int uSmoothColor;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec2 map(vec2 value, vec2 inMin, vec2 inMax, vec2 outMin, vec2 outMax) {
    return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

float valuemap(float r) {
    return r*inversesqrt(r*r+0.0625*uShadingIntensity)*.975+.025;
}

float saturationmap(float r) {
    float rr = 1./r;
    return rr*inversesqrt(rr*rr+0.0625*uShadingIntensity)*.975+.025;
}

////////////////////////////////
//  Complex function library  //
////////////////////////////////

vec2 cre(vec2 z) {
    return vec2(z.x,0.); 
}
vec2 cim(vec2 z) { 
    return vec2(z.y,0.); 
}
vec2 carg(vec2 z) { 
    float angle = TAU*.5 - mod(TAU*.5 - atan(z.y,z.x), TAU);
    return vec2(angle, 0.); 
}
vec2 carg_o(float off, vec2 z) { 
    float angle = TAU*.5 - mod(TAU*.5 - atan(z.y,z.x) - off, TAU) - off;
    return vec2(angle, 0.); 
}
vec2 cabs(vec2 z) { 
    return vec2(sqrt(z.x*z.x + z.y*z.y),0.); 
}
vec2 cnorm(vec2 z) { 
    return vec2(z.x*z.x + z.y*z.y,0.); 
}
vec2 cconj(vec2 z) { 
    return vec2(z.x, -z.y); 
}
vec2 cmul(vec2 z1, vec2 z2) {
    return vec2(z1.x*z2.x - z1.y*z2.y, z1.x*z2.y + z1.y*z2.x);
}
vec2 cdiv(vec2 z1, vec2 z2) {
    return vec2(z1.x*z2.x + z1.y*z2.y, -z1.x*z2.y + z1.y*z2.x)/(z2.x*z2.x + z2.y*z2.y);
}
vec2 crecip(vec2 z) {
    return vec2(z.x, -z.y)/(z.x*z.x + z.y*z.y);
}
vec2 csquare(vec2 z) {
    return vec2(z.x*z.x - z.y*z.y, 2.*z.x*z.y);
}
vec2 cexp(vec2 z) { 
    return exp(z.x)*vec2(cos(z.y), sin(z.y)); 
}
vec2 clog(vec2 z) { 
    return vec2(log(cabs(z).x), carg(z).x); 
}
vec2 clog_o(float off, vec2 z) { 
    return vec2(log(cabs(z).x), carg_o(off, z).x); 
}
vec2 clogbase(vec2 z, vec2 base) { 
    return cdiv(clog(z),clog(base));
}
vec2 clogbase_o(float off, vec2 z, vec2 base) { 
    return cdiv(clog_o(off, z),clog_o(off, base));
}
vec2 cpow(vec2 z1, vec2 z2) { 
    return cexp(cmul(z2, clog(z1))); 
}
vec2 croot(vec2 z1, vec2 z2) { 
    return cexp(cmul(crecip(z2), clog(z1))); 
}
vec2 csqrt(vec2 z) { 
    return cexp(0.5*clog(z)); 
}
vec2 csqrt_o(float off, vec2 z) { 
    return cexp(0.5*clog_o(off, z)); 
}
vec2 csin(vec2 z) {
    vec2 e1 = cexp(vec2( z.y,-z.x)); 
    vec2 e2 = cexp(vec2(-z.y, z.x));
    vec2 w = .5*(e1-e2);
    return vec2(-w.y,w.x);
}
vec2 ccos(vec2 z) { 
    vec2 e1 = cexp(vec2( z.y,-z.x)); 
    vec2 e2 = cexp(vec2(-z.y, z.x));
    return .5*(e1 + e2);
}
vec2 ctan(vec2 z) {
    vec2 e1 = cexp(vec2( z.y,-z.x)); 
    vec2 e2 = cexp(vec2(-z.y, z.x));
    vec2 w = cdiv(e1 - e2, e1 + e2);
    return vec2(-w.y,w.x);
}
vec2 csinh(vec2 z) { 
    vec2 e1 = cexp(z); 
    vec2 e2 = cexp(-z);
    return .5*(e1 - e2);
}
vec2 ccosh(vec2 z) { 
    vec2 e1 = cexp(z); 
    vec2 e2 = cexp(-z);
    return .5*(e1 + e2);
}
vec2 ctanh(vec2 z) { 
    vec2 e1 = cexp(z); 
    vec2 e2 = cexp(-z);
    return cdiv(e1 - e2, e1 + e2);
}
vec2 casin(vec2 z) { 
    vec2 v = clog( csqrt(vec2(1.,0.)-csquare(z)) + vec2(-z.y,z.x) ); 
    return vec2(v.y,-v.x); 
}
vec2 cacos(vec2 z) { 
    vec2 v = clog( csqrt(vec2(1.,0.)-csquare(z)) + vec2(-z.y,z.x) ); 
    return CONST_TAU*.25 + vec2(-v.y,v.x); 
}
vec2 catan(vec2 z) { 
    vec2 v = clog(cdiv(vec2(1.,0.) - vec2(-z.y,z.x), vec2(1.,0.) + vec2(-z.y,z.x))); 
    return .5*vec2(-v.y,v.x); 
}
vec2 casin_o(float off, vec2 z) { 
    vec2 v = clog(csqrt_o(off, vec2(1.,0.)-csquare(z)) + vec2(-z.y,z.x) ); 
    return vec2(v.y,-v.x); 
}
vec2 cacos_o(float off, vec2 z) { 
    vec2 v = clog(csqrt_o(off, vec2(1.,0.)-csquare(z)) + vec2(-z.y,z.x) ); 
    return CONST_TAU*.25 + vec2(-v.y,v.x); 
}
vec2 casinh(vec2 z) { 
    return clog(csqrt(vec2(1.,0.)+csquare(z)) + z); 
}
vec2 cacosh(vec2 z) { 
    return clog(csqrt(csquare(z)-vec2(1.,0.)) + z); 
}
vec2 catanh(vec2 z) { 
    return 0.5*clog(cdiv(vec2(1.,0.)+z, vec2(1.,0.)-z)); 
}
vec2 casinh_o(float off, vec2 z) { 
    return clog(csqrt_o(off, vec2(1.,0.)+csquare(z)) + z); 
}
vec2 cacosh_o(float off, vec2 z) { 
    return clog(csqrt_o(off, csquare(z)-vec2(1.,0.)) + z); 
}

// values for gamma function
const float gammaP0 = 676.5203681218851;
const float gammaP1 = -1259.1392167224028;
const float gammaP2 = 771.32342877765313;
const float gammaP3 = -176.61502916214059;
const float gammaP4 = 12.507343278686905;
const float gammaP5 = -0.13857109526572012;
const float gammaP6 = 9.9843695780195716e-6;
const float gammaP7 = 1.5056327351493116e-7;

vec2 gamma_inner(vec2 z) {
    z -= vec2(1.,0.);
    vec2 x = vec2(0.99999999999980993,0.);
    x += cdiv(vec2(gammaP0,0.), z + vec2(1.,0.));
    x += cdiv(vec2(gammaP1,0.), z + vec2(2.,0.));
    x += cdiv(vec2(gammaP2,0.), z + vec2(3.,0.));
    x += cdiv(vec2(gammaP3,0.), z + vec2(4.,0.));
    x += cdiv(vec2(gammaP4,0.), z + vec2(5.,0.));
    x += cdiv(vec2(gammaP5,0.), z + vec2(6.,0.));
    x += cdiv(vec2(gammaP6,0.), z + vec2(7.,0.));
    x += cdiv(vec2(gammaP7,0.), z + vec2(8.,0.));
    vec2 t = z + vec2(7.5,0.);
    return cmul(
        sqrt(TAU) * cpow(t, z + vec2(0.5,0.)),
        cmul(cexp(-t), x)
    );
}

vec2 cgamma(vec2 z) {
    if(z.x < 0.5) {
        return cdiv(CONST_TAU*.5, cmul(csin(cmul(CONST_TAU*.5, z)), gamma_inner(vec2(1.,0.) - z)));
    } else {
        return gamma_inner(z);
    }
}


vec2 cdigamma_pos(vec2 z) {
    z -= vec2(.5,0);
    float denom = dot(z, z);
    vec2 iz = vec2(1.,-1.) * z / denom;
    vec2 iz3 = vec2(z.x*z.x*z.x - 3.*z.x*z.y*z.y, z.y*z.y*z.y - 3.*z.y*z.x*z.x) / (denom*denom*denom);
    return clog(z + 0.041666666666666664*iz + 0.006423611111111111*iz3);
}

vec2 cdigamma(vec2 z) {
    if(z.x > 10. || abs(z.y) > 10.) {
        return cdigamma_pos(z);
    } else if(z.x > -20.) {
        vec2 res = cdigamma_pos(z + vec2(1000.,0.));
        for(int i = 0; i < 1001; i++) {
            vec2 denom = vec2(i,0) + z;
            res -= vec2(1,-1) * denom / dot(denom, denom);
        }
        return res;
    } else {
        return cdigamma_pos(vec2(1.,0.) - z) - cdiv(CONST_TAU*.5, ctan(TAU*.5 * z));
    }
}

#define ERF_P 0.3275911
#define ERF_A1 0.254829592
#define ERF_A2 -0.284496736
#define ERF_A3 1.421413741
#define ERF_A4 -1.453152027
#define ERF_A5 1.061405429

float erf_gt0(float x) {
    float denom = 1. + ERF_P*x;
    float denom2 = denom*denom;
    return 1. - (ERF_A1/denom + ERF_A2/denom2 + ERF_A3/(denom*denom2) + ERF_A4/(denom2*denom2) + ERF_A5/(denom2*denom2*denom))*exp(-x*x);
}

float erf(float x) {
    if(x >= 0.) {
        return erf_gt0(x);
    } else {
        return -erf_gt0(-x);
    }
}

#define CERF_A 0.5
#define CERF_ITERS 20
vec2 cerf_near_re(vec2 z) {
    float x = z.x;
    float y = z.y;
    float x2 = x*x;
    float exp_neg_x2 = exp(-x2);
    vec2 summation = vec2(0);
    for(int i = 1; i < CERF_ITERS; i++) {
        float n = float(i);
        float a2n2 = CERF_A*CERF_A*n*n;
        float mult = exp(-a2n2)/(4.*a2n2 + 4.*x2);
        float cosh_2any = cosh(2.*CERF_A*n*y);
        float sinh_2any = sinh(2.*CERF_A*n*y);
        float cos_2xy = cos(2.*x*y);
        float sin_2xy = sin(2.*x*y);
        summation += mult*vec2(
            x - x*cosh_2any*cos_2xy + CERF_A*n*sinh_2any*sin_2xy,
            x*cosh_2any*sin_2xy + CERF_A*n*sinh_2any*cos_2xy
        );
        if(abs(y) > 8. && i > 7) {
            break;
        } else if(abs(y) > 4. && i > 9) {
            break;
        } 
    }
    summation *= 16.*CERF_A*exp_neg_x2/TAU;
    float coeff = CERF_A*exp_neg_x2/(TAU*.5*x);
    summation += vec2(erf(x) + coeff*(1. - cos(2.*x*y)), coeff*sin(2.*x*y));
    return summation;
}

#define CERF_TERMS 250
#define RECIP_SQRT_PI 0.5641895835477563
vec2 cerf_near_im(vec2 z) {
    vec2 z2 = csquare(z);
    vec2 coeff = 2. * RECIP_SQRT_PI * cmul(z, cexp(-z2));
    vec2 term = vec2(float(CERF_TERMS*2 + 1), 0);
    for(int i = 0; i < CERF_TERMS; i++) {
        int j = CERF_TERMS - i;
        if(j < 1) {
            break;
        }
        if((j / 2) * 2 == j) {
            term = vec2(float(2*j - 1), 0.) + cdiv(float(2*j)*z2, term);
        } else {
            term = vec2(float(2*j - 1), 0.) - cdiv(float(2*j)*z2, term);
        }
    }
    return cdiv(coeff, term);

}

vec2 cerf(vec2 z) {
    if(z.y == 0.) {
        return vec2(erf(z.x), 0);
    } else if(abs(z.x) < abs(z.y)) {
        return cerf_near_im(z);
    } else {
        return cerf_near_re(z);
    }
}

vec2 ceulerfn(vec2 z) {
    if(cabs(z).x > 1.) {
        return z*0./0.;
    }
    vec2 res = vec2(1,0);
    vec2 w = z;
    for(int i = 0; i < 600; i++) {
        res = cmul(res, vec2(1,0) - w);
        w = cmul(w, z);
    }
    return res;
}

vec2 csignre(vec2 z) {
    return vec2(sign(z.x), 0);
}

vec2 csignim(vec2 z) {
    return vec2(sign(z.y), 0);
}

vec2 cunitcircle(vec2 z) {
    return z/cabs(z).x;
}

#define LAMBERT_W_ITERS 30

vec2 clambertw(vec2 z) {
    vec2 res;
    if(z.x < -0.3678795) {
        if(z.y == 0.) {
            res = vec2(z.x, 1.);
        } else {
            res = vec2(z.x, z.y + 0.4*sign(z.y));
        }
    } else {
        res = z;
    }
    res = clog(res + vec2(1,0));
    for(int i = 0; i < LAMBERT_W_ITERS; i++) {
        res = cdiv(csquare(res) + cmul(z, cexp(-res)), res + vec2(1,0));
    }
    return res;
}

// https://www.desmos.com/calculator/eh9vx5dil4
const float ti0 = 0.927295218002;
const float ti1 = -0.254590436003;
const float ti2 = -0.130819127994;
const float ti3 = 0.176304922654;
const float ti4 = -0.0454098453075;
const float ti5 = -0.0648283093849;
const float ti6 = 0.0695819521032;
const float ti7 = -0.00902813277778;
const float ti8 = -0.036994;
const float ti9 = 0.0321614;
const float ti10 = 0.00102442;
const float ti11 = -0.0221968;
const float ti12 = 0.0156038;
const float ti13 = 0.00369106;
const float ti14 = -0.0135653;

const float tiOffset = -0.487222405586;

vec2 cti_inner(vec2 z) {
    z -= vec2(0.5,0);
    vec2 z2 = cmul(z,z);
    vec2 z3 = cmul(z2,z);
    vec2 z4 = cmul(z2,z2);
    vec2 z5 = cmul(z4,z);
    vec2 z6 = cmul(z4,z2);
    vec2 z7 = cmul(z4,z3);
    vec2 z8 = cmul(z4,z4);

    return ti0*z 
        + ti1/2.*z2 
        + ti2/3.*z3
        + ti3/4.*z4 
        + ti4/5.*z5
        + ti5/6.*z6
        + ti6/7.*z7
        + ti7/8.*z8 
        + ti8/9.*cmul(z8,z)
        + ti9/10.*cmul(z8,z2)
        + ti10/11.*cmul(z8,z3)
        + ti11/12.*cmul(z8,z4)
        + ti12/13.*cmul(z8,z5)
        + ti13/14.*cmul(z8,z6)
        + ti14/15.*cmul(z8,z7)
        - vec2(tiOffset,0);
}

vec2 cti(vec2 z) {
    float m = 1.;
    if(z.x < 0.) {
        m = -1.;
    }
    if(cnorm(z).x <= 1.) {
        return m*cti_inner(m*z);
    } else {
        return m*(TAU*.25*clog(vec2(abs(z.x), z.y*m)) + cti_inner(m*crecip(z)));
    }
}

// Weierstrass P function (℘)
vec2 cweierp(vec2 z, vec2 w1, vec2 w2) {
    vec2 sum = cpow(z, vec2(-2,0));
    for(int i = -25; i <= 25; i++) {
        for(int j = -25; j <= 25; j++) {
            if(i == 0 && j == 0) { continue; }

            vec2 lambda = float(i)*w1 + float(j)*w2;
            sum += cpow(z - lambda, vec2(-2,0)) - cpow(lambda, vec2(-2,0));
        }
    }

    return sum/2.;
}

////////////////////
//  Drawing code  //
////////////////////

// will be implemented by the input expression
vec2 f(vec2 z, vec2 c, vec2 n);
vec2 z_init(vec2 z);
vec2 c_init(vec2 z);

out vec4 fragColor;
void main() {
    float axis_size = 1./uResolution.x;
    vec2 pt = map(
        gl_FragCoord.xy,
        vec2(0.), uResolution.xy,
        uRangeAxes.xz, uRangeAxes.yw
    );
    vec2 z = z_init(pt);
    vec2 c = c_init(pt);
    for(int i = 0; i < MAX_ITERS; i++) {
        if(i >= uIterations) {
            break;
        }
        z = f(z, c, vec2(float(i),0.));
    }
    float rad = cabs(z).x;
    if(rad == 0.) {
        fragColor = vec4(vec3(uSwapBlackWhite),1.);
        return;
    } else if(isinf(rad)) {
        fragColor = vec4(vec3(1-uSwapBlackWhite),1.);
        return;
    } else if(isnan(rad)) {
        fragColor = vec4(.5,.5,.5,1.);
        return;
    }
    float arg = carg(z).x;
    float s = uSwapBlackWhite == 0 ? saturationmap(rad) : valuemap(rad);
    float v = uSwapBlackWhite == 0 ? valuemap(rad) : saturationmap(rad);
    if(uDrawContours == 1) {
        if(abs(rad-1.) < 0.1) {
            s *= 0.5;
            v = clamp(v*1.5, 0., 1.);
        } else if(rad > 0.1 && abs(fract(rad+0.5)-0.5) < 0.1) {
            v *= 0.7;
        }
    }
    vec3 col;
    if(uSmoothColor == 1) {
        float r = cos(arg)*.5 + .5;
        float g = cos(arg - TAU/3.)*.5 + .5;
        float b = cos(arg - 2.*TAU/3.)*.5 + .5;
        vec3 hue = vec3(r,g,b);
        col = hue*(1. - (1.-s) - (1.-v)) + (1.-s);
    } else {
        col = hsv2rgb(vec3(arg/TAU, s, v));
    }
    fragColor = vec4(col,1.);
}
