import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Heart, BookOpen, Palette, Zap, Users } from 'lucide-react';
import heroImage from '@/assets/hero-novel.jpg';
import character1 from '@/assets/character-1.jpg';
import character2 from '@/assets/character-2.jpg';
import character3 from '@/assets/character-3.jpg';

const Landing = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Визуальный редактор',
      description: 'Создавайте сцены, диалоги и ветвления без единой строчки кода'
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: 'Уникальные персонажи',
      description: 'Добавляйте спрайты с эмоциями и настраивайте внешний вид героев'
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Романтические истории',
      description: 'Идеально подходит для создания романтических и dating sim новелл'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Мгновенный предпросмотр',
      description: 'Тестируйте новеллу в реальном времени прямо в редакторе'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Множество концовок',
      description: 'Создавайте разветвлённые сюжеты с множеством финалов'
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Атмосферные эффекты',
      description: 'Музыка, звуки и визуальные эффекты для полного погружения'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Visual Novel Scene" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        
        <div className="relative container py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Конструктор визуальных новелл</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Создавай{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                романтические
              </span>{' '}
              истории
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Простой и мощный инструмент для создания визуальных новелл. 
              Добавляй персонажей, пиши диалоги, создавай ветвящиеся сюжеты — 
              всё это без программирования.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link to="/novels">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                    <BookOpen className="h-5 w-5" />
                    Мои новеллы
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                    <Sparkles className="h-5 w-5" />
                    Начать бесплатно
                  </Button>
                </Link>
              )}
              <Link to="/demo">
                <Button size="lg" variant="outline" className="gap-2">
                  <Heart className="h-5 w-5" />
                  Демо новелла
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Characters Showcase */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Создавай незабываемых персонажей
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Добавляй уникальных героев с различными эмоциями и спрайтами. 
              Каждый персонаж оживёт в твоей истории.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[character1, character2, character3].map((img, i) => (
              <Card key={i} className="overflow-hidden group hover:shadow-xl transition-all duration-500 border-primary/10 hover:border-primary/30">
                <CardContent className="p-0 relative">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={img} 
                      alt={`Character ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-sm text-muted-foreground">
                        {i === 0 && 'Нежная и загадочная'}
                        {i === 1 && 'Элегантная и таинственная'}
                        {i === 2 && 'Весёлая и озорная'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Всё для создания идеальной новеллы
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Мощные инструменты, которые сделают твою историю незабываемой
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Card className="overflow-hidden border-0 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-primary/10">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Готов создать свою историю?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Присоединяйся к сообществу авторов визуальных новелл. 
                Бесплатно и без ограничений.
              </p>
              {user ? (
                <Link to="/novels">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                    <BookOpen className="h-5 w-5" />
                    Перейти к моим новеллам
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                    <Sparkles className="h-5 w-5" />
                    Создать аккаунт
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container text-center text-muted-foreground">
          <p>© 2024 Novel Constructor. Создавай свои истории.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
