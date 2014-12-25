window.ClassTester = {
    
    beforeEachSingleton: function(Class)
    {
        Class.prototype.singletonInstance = null;
    },
    
    tests: {
        
        isInstanceOf_description: "is instance of",
        isInstanceOf: function (Class)
        {
            var _class = new Class();
                
            var isClassInstance = _class instanceof Class;
            
            expect(isClassInstance).toEqual(true);
        },
        
        isInstanceOf_withoutNewKeyword_description: "is instance of without new keyword",
        isInstanceOf_withoutNewKeyword: function (Class)
        {
            var _class = Class();
                
            var isClassInstance = _class instanceof Class;
            
            expect(isClassInstance).toEqual(true);
        },
        
        areSingletonInstancesSame_description: "is same object when creating with new keywords",
        areSingletonInstancesSame: function(Class)
        {
            var _class1 = new Class();
            var _class2 = new Class();
            
            var actual = _class1 === _class2;
            
            expect(actual).toEqual(true);
        },
        
        areSingletonInstancesSame_instantiateWithoutNew_description: "is same object when creating without new keywords",
        areSingletonInstancesSame_instantiateWithoutNew: function(Class)
        {
            var _class1 = Class();
            var _class2 = Class();
            
            var actual = _class1 === _class2;
            
            expect(actual).toEqual(true);
        },
        
        areSingletonInstancesSame_instantiateWithAndWithoutNew_description: "is same object when creating with and without new keywords",
        areSingletonInstancesSame_instantiateWithAndWithoutNew: function(Class)
        {
            var _class1 = new Class();
            var _class2 = Class();
            
            var actual = _class1 === _class2;
            expect(actual).toEqual(true);
            
            var isClassInstance = _class1 instanceof Class;
            expect(isClassInstance).toEqual(true);
        },
        
        isExtendingBaseClass_description: "is extending base class",
        isExtendingBaseClass: function(Class, BaseClass)
        {
            var _class = new Class();
            var _baseClass = new BaseClass();
            var hasProperty;
            
            for(var property in _baseClass)
            {
                hasProperty = _class.hasOwnProperty(property);
                expect(hasProperty).toEqual(true);
            }
        }
    },
    
    getClassName: function (Class)
    {
        var classString = Class.toString();
        var startIndex = 'function '.length;
        var endIndex = classString.indexOf('(');
        var name = classString.substring(startIndex, endIndex);
        return name;
    },
    
    classTest: function(Class) {
        
        describe(ClassTester.getClassName(Class) + " class test:", function() {
            
            it(ClassTester.tests.isInstanceOf_description, function() {
                ClassTester.tests.isInstanceOf(Class)
            });
            
            it(ClassTester.tests.isInstanceOf_withoutNewKeyword_description, function() {
               ClassTester.tests.isInstanceOf_withoutNewKeyword(Class); 
            });
        });
    },
    
    singletonClassTest: function(Class) {
        
        ClassTester.classTest(Class);
        
        describe(ClassTester.getClassName(Class) + " singleton class test:", function() {
            
            beforeEach(function() {
                ClassTester.beforeEachSingleton(Class);
            });
                
            it(ClassTester.tests.areSingletonInstancesSame_description, function() {
                ClassTester.tests.areSingletonInstancesSame(Class);
            });
            
            it(ClassTester.tests.areSingletonInstancesSame_instantiateWithoutNew_description, function() {
                ClassTester.tests.areSingletonInstancesSame_instantiateWithoutNew(Class);
            });
            
            it(ClassTester.tests.areSingletonInstancesSame_instantiateWithAndWithoutNew_description, function() {
                ClassTester.tests.areSingletonInstancesSame_instantiateWithAndWithoutNew(Class);
            });
        });
    },
    
    extendedClassTest: function(Class, BaseClass)
    {
        ClassTester.classTest(Class);
        
        describe(ClassTester.getClassName(Class) + " extendeds " + ClassTester.getClassName(BaseClass) + " class test:", function() {
            
            it(ClassTester.tests.isExtendingBaseClass_description, function() {
                ClassTester.tests.isExtendingBaseClass(Class, BaseClass);
            });
        });
    }
};