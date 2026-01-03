export namespace ai {
	
	export class AIResponse {
	    content: string;
	    usage?: Record<string, any>;
	    raw?: any;
	
	    static createFrom(source: any = {}) {
	        return new AIResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.content = source["content"];
	        this.usage = source["usage"];
	        this.raw = source["raw"];
	    }
	}
	export class AudioRequest {
	    prompt: string;
	    model: string;
	    voice?: string;
	    speed?: number;
	    options?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new AudioRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.prompt = source["prompt"];
	        this.model = source["model"];
	        this.voice = source["voice"];
	        this.speed = source["speed"];
	        this.options = source["options"];
	    }
	}
	export class ImageRequest {
	    prompt: string;
	    model: string;
	    size?: string;
	    quality?: string;
	    style?: string;
	    options?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new ImageRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.prompt = source["prompt"];
	        this.model = source["model"];
	        this.size = source["size"];
	        this.quality = source["quality"];
	        this.style = source["style"];
	        this.options = source["options"];
	    }
	}
	export class TextRequest {
	    prompt: string;
	    model: string;
	    temperature?: number;
	    maxTokens?: number;
	    options?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new TextRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.prompt = source["prompt"];
	        this.model = source["model"];
	        this.temperature = source["temperature"];
	        this.maxTokens = source["maxTokens"];
	        this.options = source["options"];
	    }
	}
	export class VideoRequest {
	    prompt: string;
	    model: string;
	    duration?: string;
	    resolution?: string;
	    options?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new VideoRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.prompt = source["prompt"];
	        this.model = source["model"];
	        this.duration = source["duration"];
	        this.resolution = source["resolution"];
	        this.options = source["options"];
	    }
	}

}

export namespace database {
	
	export class AIConfig {
	    provider: string;
	    apiKey: string;
	    baseUrl: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new AIConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.provider = source["provider"];
	        this.apiKey = source["apiKey"];
	        this.baseUrl = source["baseUrl"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

